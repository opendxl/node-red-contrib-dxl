'use strict'

const should = require('should')
const dxlClientNode = require('../../nodes/dxl-client')
const testNode = require('../../nodes/dxl-response')
const nodeRedTestHelper = require('node-red-node-test-helper')
const testHelpers = require('./test-helpers')

describe('dxl-core-response node', function () {
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
    const responseNodeId = 'dxl.responseId'

    const testFlows = [
      testHelpers.getClientNodeConfig(clientNodeId),
      {
        id: responseNodeId,
        name: 'my response',
        type: 'dxl-core-response',
        client: clientNodeId
      }
    ]
    testHelpers.loadNodeRed(
      [dxlClientNode, testNode],
      testFlows,
      function () {
        const responseOutNode = nodeRedTestHelper.getNode(responseNodeId)
        responseOutNode.should.have.property('name', 'my response')
        const clientNode = nodeRedTestHelper.getNode(clientNodeId)
        should(clientNode).not.be.null()
        done()
      }, done)
  })
})
