'use strict'

var should = require('should')
var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-event-out')
var nodeRedTestHelper = require('node-red-node-test-helper')
var testHelpers = require('./test-helpers')

describe('dxl-core-event out node', function () {
  before(function (done) {
    nodeRedTestHelper.startServer(done)
  })

  afterEach(function () {
    nodeRedTestHelper.unload()
  })

  after(function (done) {
    nodeRedTestHelper.stopServer(done)
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
        var eventOutNode = nodeRedTestHelper.getNode(eventOutNodeId)
        eventOutNode.should.have.property('name', 'my event out')
        var clientNode = nodeRedTestHelper.getNode(clientNodeId)
        should(clientNode).not.be.null()
        done()
      }, done)
  })
})
