'use strict'

var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-event-in')
var nodeRedHelper = require('../node-red-helper')
var testHelpers = require('./test-helpers')

describe('dxl-core-event in node', function () {
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
        var eventInNode = nodeRedHelper.getNode(eventInNodeId)
        eventInNode.should.have.property('name', 'my event in')
        eventInNode.should.have.property('_payloadType', 'obj')
        var client = nodeRedHelper.getNode(clientNodeId).dxlClient
        client.subscriptions.should.containEql(eventTopic)
        done()
      }, done)
  })
})
