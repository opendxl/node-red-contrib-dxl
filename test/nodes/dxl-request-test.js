'use strict'

const should = require('should')
const dxlClientNode = require('../../nodes/dxl-client')
const testNode = require('../../nodes/dxl-request')
const nodeRedTestHelper = require('node-red-node-test-helper')
const testHelpers = require('./test-helpers')

describe('dxl-core-request node', function () {
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
    const requestNodeId = 'dxl.requestId'
    const requestTopic = '/my/sample/topic'

    const testFlows = [
      testHelpers.getClientNodeConfig(clientNodeId),
      {
        id: requestNodeId,
        name: 'my request',
        type: 'dxl-core-request',
        topic: requestTopic,
        client: clientNodeId,
        returnType: 'bin',
        wires: []
      }
    ]
    testHelpers.loadNodeRed(
      [dxlClientNode, testNode],
      testFlows,
      function () {
        const requestNode = nodeRedTestHelper.getNode(requestNodeId)
        requestNode.should.have.property('name', 'my request')
        requestNode.should.have.property('_returnType', 'bin')
        const clientNode = nodeRedTestHelper.getNode(clientNodeId)
        should(clientNode).not.be.null()
        done()
      }, done)
  })
})
