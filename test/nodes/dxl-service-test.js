'use strict'

const dxlClientNode = require('../../nodes/dxl-client')
const testNode = require('../../nodes/dxl-service')
const nodeRedTestHelper = require('node-red-node-test-helper')
const testHelpers = require('./test-helpers')

describe('dxl-core-service node', function () {
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
    const clientNodeId = 'dxl.clientId'
    const serviceNodeId = 'dxl.serviceId'

    const firstServiceTopicEntry = {
      topic: '/my/first/topic',
      payloadType: 'bin'
    }
    const secondServiceTopicEntry = {
      topic: '/my/second/topic',
      payloadType: 'obj'
    }

    const topicEntries = [firstServiceTopicEntry, secondServiceTopicEntry]

    const testFlows = [
      testHelpers.getClientNodeConfig(clientNodeId),
      {
        id: serviceNodeId,
        name: 'my service',
        type: 'dxl-core-service',
        serviceType: 'my service',
        outputs: 2,
        client: clientNodeId,
        rules: topicEntries,
        wires: [['id1'], ['id2']]
      }
    ]
    testHelpers.loadNodeRed(
      [dxlClientNode, testNode],
      testFlows,
      function () {
        const serviceNode = nodeRedTestHelper.getNode(serviceNodeId)
        serviceNode.should.have.property('name', 'my service')
        serviceNode.should.have.property('_rules', topicEntries)
        const client = nodeRedTestHelper.getNode(clientNodeId).dxlClient
        client.subscriptions.should.containEql(firstServiceTopicEntry.topic)
        client.subscriptions.should.containEql(secondServiceTopicEntry.topic)
        done()
      }, done)
  })
})
