'use strict'

var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-service')
var nodeRedTestHelper = require('node-red-node-test-helper')
var testHelpers = require('./test-helpers')

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
    var clientNodeId = 'dxl.clientId'
    var serviceNodeId = 'dxl.serviceId'

    var firstServiceTopicEntry = {
      topic: '/my/first/topic',
      payloadType: 'bin'
    }
    var secondServiceTopicEntry = {
      topic: '/my/second/topic',
      payloadType: 'obj'
    }

    var topicEntries = [firstServiceTopicEntry, secondServiceTopicEntry]

    var testFlows = [
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
        var serviceNode = nodeRedTestHelper.getNode(serviceNodeId)
        serviceNode.should.have.property('name', 'my service')
        serviceNode.should.have.property('_rules', topicEntries)
        var client = nodeRedTestHelper.getNode(clientNodeId).dxlClient
        client.subscriptions.should.containEql(firstServiceTopicEntry.topic)
        client.subscriptions.should.containEql(secondServiceTopicEntry.topic)
        done()
      }, done)
  })
})
