'use strict'

var should = require('should')
var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-event-out')
var nodeRedHelper = require('../node-red-helper')
var testHelpers = require('./test-helpers')

describe('dxl-core-event out node', function () {
  before(function (done) {
    nodeRedHelper.startServer(done)
  })

  afterEach(function () {
    nodeRedHelper.unload()
  })

  after(function (done) {
    nodeRedHelper.stopServer(done)
  })

  it('should be loaded', function (done) {
    var clientNodeId = 'dxl.clientId'
    var eventOutNodeId = 'dxl.eventOutId'
    var eventTopic = '/my/sample/topic'

    var testFlows = [
      testHelpers.getClientNodeConfig(clientNodeId),
      {
        id: eventOutNodeId,
        name: 'my event out',
        type: 'dxl-core-event out',
        topic: eventTopic,
        client: clientNodeId,
        wires: []
      }
    ]
    testHelpers.loadNodeRed(
      [dxlClientNode, testNode],
      testFlows,
      function () {
        var eventOutNode = nodeRedHelper.getNode(eventOutNodeId)
        eventOutNode.should.have.property('name', 'my event out')
        eventOutNode.should.have.property('_topic', eventTopic)
        var clientNode = nodeRedHelper.getNode(clientNodeId)
        should(clientNode).not.be.null()
        done()
      }, done)
  })
})
