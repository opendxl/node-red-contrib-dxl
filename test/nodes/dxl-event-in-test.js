'use strict'

const dxlClientNode = require('../../nodes/dxl-client')
const testNode = require('../../nodes/dxl-event-in')
const nodeRedTestHelper = require('node-red-node-test-helper')
const testHelpers = require('./test-helpers')

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
    const clientNodeId = 'dxl.ClientId'
    const eventInNodeId = 'dxl.eventInId'
    const eventTopic = '/my/sample/topic'

    const testFlows = [
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
        const eventInNode = nodeRedTestHelper.getNode(eventInNodeId)
        eventInNode.should.have.property('name', 'my event in')
        eventInNode.should.have.property('_payloadType', 'obj')
        const client = nodeRedTestHelper.getNode(clientNodeId).dxlClient
        client.subscriptions.should.containEql(eventTopic)
        done()
      }, done)
  })
})
