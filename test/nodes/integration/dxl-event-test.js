'use strict'

var Buffer = require('buffer').Buffer
var dxl = require('@opendxl/dxl-client')
var catchNode = require('node-red/nodes/core/core/25-catch')
var functionNode = require('node-red/nodes/core/core/80-function')
var injectNode = require('node-red/nodes/core/core/20-inject')
var dxlEventOutNode = require('../../../nodes/dxl-event-out')
var dxlClientNode = require('../../../nodes/dxl-client')
var dxlEventInNode = require('../../../nodes/dxl-event-in')
var nodeRedTestHelper = require('node-red-node-test-helper')
var testHelpers = require('../test-helpers')

describe('dxl event', function () {
  before(function (done) {
    nodeRedTestHelper.startServer(done)
  })

  afterEach(function () {
    nodeRedTestHelper.unload()
  })

  after(function (done) {
    nodeRedTestHelper.stopServer(done)
  })

  var nodesToLoad = [catchNode, functionNode, injectNode,
    dxlClientNode, dxlEventOutNode, dxlEventInNode]

  var clientNodeId = 'dxl.clientId'
  var eventInNodeId = 'dxl.eventInId'
  var eventOutNodeId = 'dxl.eventOutId'
  var flowTabId = 'dxl.flowTabId'
  var helperNodeId = 'dxl.helperId'

  var eventTopic = '/dxl-event-test'

  var baseTestFlows = [
    {
      id: flowTabId,
      type: 'tab'
    },
    {
      id: 'dxl.eventInError',
      type: 'catch',
      scope: [eventInNodeId],
      wires: [[helperNodeId]],
      z: flowTabId
    },
    testHelpers.getClientNodeConfig(clientNodeId),
    {
      id: helperNodeId,
      type: 'helper'
    }
  ]

  context('when payloadType set to txt', function () {
    it('should be sent properly through the DXL fabric', function (done) {
      var testFlows = baseTestFlows.slice()

      testFlows.push({
        id: eventOutNodeId,
        type: 'dxl-core-event out',
        topic: eventTopic,
        client: clientNodeId
      })

      testFlows.push({
        id: eventInNodeId,
        type: 'dxl-core-event in',
        topic: eventTopic,
        payloadType: 'txt',
        client: clientNodeId,
        wires: [[helperNodeId]]
      })

      var expectedEventPayload = 'event payload as a string'
      testFlows.push(testHelpers.getInjectNodeConfig(expectedEventPayload,
        eventOutNodeId, 'txt'))

      testHelpers.loadNodeRed(nodesToLoad, testFlows,
        function () {
          var helperNode = nodeRedTestHelper.getNode(helperNodeId)
          helperNode.on('input', function (msg) {
            testHelpers.forwardOnError(function () {
              msg.should.have.property('payload', expectedEventPayload)
              msg.should.have.property('topic', eventTopic)
              msg.should.have.property('dxlEvent').instanceOf(dxl.Event)
              msg.should.have.propertyByPath('dxlEvent',
                'payload').equal(expectedEventPayload)
              msg.should.have.propertyByPath('dxlEvent',
                'destinationTopic').equal(eventTopic)
              msg.should.have.property('dxlMessage').equal(msg.dxlEvent)
              done()
            }, done)
          })
        }, done)
    })
  })

  context('when payloadType set to bin', function () {
    it('should be sent properly through the DXL fabric', function (done) {
      var testFlows = baseTestFlows.slice()

      testFlows.push({
        id: eventOutNodeId,
        type: 'dxl-core-event out',
        topic: '',
        client: clientNodeId
      })

      testFlows.push({
        id: eventInNodeId,
        type: 'dxl-core-event in',
        topic: eventTopic,
        payloadType: 'bin',
        client: clientNodeId,
        wires: [[helperNodeId]]
      })

      testFlows.push({
        id: 'dxl.setTopicId',
        func: 'msg.dxlTopic = "' + eventTopic + '"; return msg;',
        type: 'function',
        outputs: 1,
        wires: [[ eventOutNodeId ]]
      })

      var expectedEventPayload = Buffer.from([0x01, 0xD1, 0x9A])
      testFlows.push(testHelpers.getInjectNodeConfig('[1,209,154]',
        'dxl.setTopicId', 'bin'))

      testHelpers.loadNodeRed(nodesToLoad, testFlows,
        function () {
          var helperNode = nodeRedTestHelper.getNode(helperNodeId)
          helperNode.on('input', function (msg) {
            testHelpers.forwardOnError(function () {
              msg.should.have.property('payload', expectedEventPayload)
              done()
            }, done)
          })
        }, done)
    })
  })

  context('when payloadType set to obj', function () {
    it('should be sent properly through the DXL fabric', function (done) {
      var testFlows = baseTestFlows.slice()

      testFlows.push({
        id: eventOutNodeId,
        type: 'dxl-core-event out',
        topic: eventTopic,
        client: clientNodeId
      })

      testFlows.push({
        id: eventInNodeId,
        type: 'dxl-core-event in',
        topic: eventTopic,
        payloadType: 'obj',
        client: clientNodeId,
        wires: [[helperNodeId]]
      })

      testFlows.push({
        id: 'dxl.setTopicId',
        func: 'msg.dxlTopic = "/should/be/overridden"; return msg;',
        type: 'function',
        outputs: 1,
        wires: [[ eventOutNodeId ]]
      })

      var expectedEventPayload = {hello: 'how are you', fine: 'thanks'}
      testFlows.push(testHelpers.getInjectNodeConfig(
        JSON.stringify(expectedEventPayload), 'dxl.setTopicId', 'obj'))

      testHelpers.loadNodeRed(nodesToLoad, testFlows,
        function () {
          var helperNode = nodeRedTestHelper.getNode(helperNodeId)
          helperNode.on('input', function (msg) {
            testHelpers.forwardOnError(function () {
              msg.should.have.property('payload', expectedEventPayload)
              done()
            }, done)
          })
        }, done)
    })
  })

  context('when event payload is malformed', function () {
    it('should generate a catchable error', function (done) {
      var testFlows = baseTestFlows.slice()

      testFlows.push({
        id: eventOutNodeId,
        type: 'dxl-core-event out',
        topic: eventTopic,
        client: clientNodeId
      })

      testFlows.push({
        id: eventInNodeId,
        type: 'dxl-core-event in',
        topic: eventTopic,
        payloadType: 'obj',
        client: clientNodeId,
        wires: [[helperNodeId]],
        z: flowTabId
      })

      var eventPayload = 'malformed json'
      testFlows.push(testHelpers.getInjectNodeConfig(eventPayload,
        eventOutNodeId, 'txt'))

      testHelpers.loadNodeRed(nodesToLoad, testFlows,
        function () {
          var helperNode = nodeRedTestHelper.getNode(helperNodeId)
          helperNode.on('input', function (msg) {
            testHelpers.forwardOnError(function () {
              msg.should.have.propertyByPath(
                'error', 'message').match(/malformed json/)
              msg.should.have.propertyByPath(
                'error', 'source', 'type').equal('dxl-core-event in')
              done()
            }, done)
          })
        }, done)
    })
  })
})
