'use strict'

var should = require('should')
var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-response')
var nodeRedHelper = require('../node-red-helper')
var testHelpers = require('./test-helpers')

describe('dxl-core-response node', function () {
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
    var responseNodeId = 'dxl.responseId'

    var testFlows = [
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
        var responseOutNode = nodeRedHelper.getNode(responseNodeId)
        responseOutNode.should.have.property('name', 'my response')
        var clientNode = nodeRedHelper.getNode(clientNodeId)
        should(clientNode).not.be.null()
        done()
      }, done)
  })
})
