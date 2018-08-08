'use strict'

var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-event-in')
var nodeRedTestHelper = require('node-red-node-test-helper')
var testHelpers = require('./test-helpers')

describe('dxl-core-event in node', function () {
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
    var clientNodeId = 'dxl.ClientId'
    var eventInNodeId = 'dxl.eventInId'
    var eventTopic = '/my/sample/topic'

    var testFlows = [
      testHelpers.getClientNodeConfig(clientNodeId),
      {
        id: eventInNodeId,
        name: 'my event in',
        type: 'dxl-core-event in',
        topic: eventTopic,
        payloadType: 'obj',
        client: clientNodeId
      }
    ]
    testHelpers.loadNodeRed(
      [dxlClientNode, testNode],
      testFlows,
      function () {
        var eventInNode = nodeRedTestHelper.getNode(eventInNodeId)
        eventInNode.should.have.property('name', 'my event in')
        eventInNode.should.have.property('_payloadType', 'obj')
        var client = nodeRedTestHelper.getNode(clientNodeId).dxlClient
        client.subscriptions.should.containEql(eventTopic)
        done()
      }, done)
  })
})
