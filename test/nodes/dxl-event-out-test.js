'use strict'

const should = require('should')
const dxlClientNode = require('../../nodes/dxl-client')
const testNode = require('../../nodes/dxl-event-out')
const nodeRedTestHelper = require('node-red-node-test-helper')
const testHelpers = require('./test-helpers')

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
    const clientNodeId = 'dxl.clientId'
    const eventOutNodeId = 'dxl.eventOutId'
    const eventTopic = '/my/sample/topic'

    const testFlows = [
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
        const eventOutNode = nodeRedTestHelper.getNode(eventOutNodeId)
        eventOutNode.should.have.property('name', 'my event out')
        const clientNode = nodeRedTestHelper.getNode(clientNodeId)
        should(clientNode).not.be.null()
        done()
      }, done)
  })
})
