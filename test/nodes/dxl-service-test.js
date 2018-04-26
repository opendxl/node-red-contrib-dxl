'use strict'

var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-service')
var nodeRedHelper = require('../node-red-helper')
var testHelpers = require('./test-helpers')

describe('dxl-service in node', function () {
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
        name: 'my service in',
        type: 'dxl-service in',
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
        var serviceNode = nodeRedHelper.getNode(serviceNodeId)
        serviceNode.should.have.property('name', 'my service in')
        serviceNode.should.have.property('_rules', topicEntries)
        var client = nodeRedHelper.getNode(clientNodeId).dxlClient
        client.subscriptions.should.containEql(firstServiceTopicEntry.topic)
        client.subscriptions.should.containEql(secondServiceTopicEntry.topic)
        done()
      }, done)
  })
})
