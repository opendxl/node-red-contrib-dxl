'use strict'

const Buffer = require('buffer').Buffer
const dxl = require('@opendxl/dxl-client')
const catchNode = require('@node-red/nodes/core/core/25-catch')
const functionNode = require('@node-red/nodes/core/core/80-function')
const injectNode = require('@node-red/nodes/core/core/20-inject')
const dxlClientNode = require('../../../nodes/dxl-client')
const dxlRequestNode = require('../../../nodes/dxl-request')
const dxlResponseNode = require('../../../nodes/dxl-response')
const dxlServiceNode = require('../../../nodes/dxl-service')
const nodeRedTestHelper = require('node-red-node-test-helper')
const testHelpers = require('../test-helpers')

describe('dxl service', function () {
  before(function (done) {
    nodeRedTestHelper.startServer(done)
  })

  afterEach(function () {
    nodeRedTestHelper.unload()
  })

  after(function (done) {
    nodeRedTestHelper.stopServer(done)
  })

  const nodesToLoad = [catchNode, functionNode, injectNode,
    dxlClientNode, dxlRequestNode, dxlResponseNode, dxlServiceNode]

  const clientNodeId = 'dxl.clientId'
  const flowTabId = 'dxl.flowTabId'
  const helperNodeId = 'dxl.helperId'
  const requestNodeId = 'dxl.requestId'
  const serviceNodeId = 'dxl.serviceId'

  const baseTestFlows = [
    {
      id: flowTabId,
      type: 'tab'
    },
    testHelpers.getClientNodeConfig(clientNodeId),
    {
      id: serviceNodeId,
      type: 'dxl-core-service',
      name: 'my service',
      serviceType: 'dxl test service',
      client: clientNodeId,
      rules: [
        {
          payloadType: 'obj',
          topic: '/dxl-service-test/no-response'
        },
        {
          payloadType: 'txt',
          topic: '/dxl-service-test/txt'
        },
        {
          payloadType: 'bin',
          topic: '/dxl-service-test/bin'
        },
        {
          payloadType: 'obj',
          topic: '/dxl-service-test/obj'
        },
        {
          payloadType: 'obj',
          topic: '/dxl-service-test/error'
        }
      ],
      outputs: 5,
      wires: [
        [helperNodeId],
        ['txt.function'],
        ['bin.function'],
        ['obj.function'],
        ['error.function']
      ],
      z: flowTabId
    },
    {
      func: 'msg.payload = "txt is: " + msg.payload; return msg;',
      id: 'txt.function',
      type: 'function',
      outputs: 1,
      wires: [['dxl.response']]
    },
    {
      func: 'msg.payload = Buffer.concat([msg.payload, Buffer.from([32])]); ' +
        'return msg;',
      id: 'bin.function',
      type: 'function',
      outputs: 1,
      wires: [['dxl.response']]
    },
    {
      func: 'msg.payload.other = "added by function"; return msg;',
      id: 'obj.function',
      type: 'function',
      outputs: 1,
      wires: [['dxl.response']]
    },
    {
      func: 'msg.dxlError = {code: msg.payload.errorCode}; ' +
        'node.error(msg.payload.errorMessage, msg);',
      id: 'error.function',
      type: 'function',
      outputs: 1,
      wires: [['dxl.response']],
      z: flowTabId
    },
    {
      id: 'dxl.response',
      type: 'dxl-core-response',
      client: clientNodeId
    },
    {
      id: 'dxl.serviceError',
      type: 'catch',
      scope: [serviceNodeId, 'error.function'],
      wires: [['dxl.response']],
      z: flowTabId
    },
    {
      id: 'dxl.requestError',
      type: 'catch',
      scope: [requestNodeId],
      wires: [[helperNodeId]],
      z: flowTabId
    },
    {
      id: helperNodeId,
      type: 'helper'
    }
  ]

  it('should copy the dxl request into a flow msg', function (done) {
    const testFlows = baseTestFlows.slice()
    testFlows.push({
      id: requestNodeId,
      type: 'dxl-core-request',
      topic: '/dxl-service-test/no-response',
      returnType: 'obj',
      client: clientNodeId,
      wires: [[helperNodeId]],
      z: flowTabId
    })

    const requestPayload = { hello: 'how are you', fine: 'thanks' }
    testFlows.push(testHelpers.getInjectNodeConfig(requestPayload,
      requestNodeId, 'obj'))

    testHelpers.loadNodeRed(nodesToLoad, testFlows,
      function () {
        const helperNode = nodeRedTestHelper.getNode(helperNodeId)
        helperNode.on('input', function (msg) {
          testHelpers.forwardOnError(function () {
            msg.should.have.property('payload', requestPayload)
            msg.should.have.property('topic', '/dxl-service-test/no-response')
            msg.should.have.property('dxlRequest').instanceOf(dxl.Request)
            msg.should.have.propertyByPath('dxlRequest', 'payload').eql(
              requestPayload)
            msg.should.have.property('dxlMessage').equal(msg.dxlRequest)
            msg.should.not.have.property('dxlError')
            done()
          }, done)
        })
      }, done)
  })

  context('when payloadType set to txt', function () {
    it('should be sent properly through the DXL fabric', function (done) {
      const testFlows = baseTestFlows.slice()
      testFlows.push({
        id: requestNodeId,
        type: 'dxl-core-request',
        topic: '/dxl-service-test/txt',
        returnType: 'txt',
        client: clientNodeId,
        wires: [[helperNodeId]]
      })

      const requestPayload = 'my request payload as a string'
      const expectedResponsePayload = 'txt is: ' + requestPayload
      testFlows.push(testHelpers.getInjectNodeConfig(requestPayload,
        requestNodeId, 'txt'))

      testHelpers.loadNodeRed(nodesToLoad, testFlows,
        function () {
          const helperNode = nodeRedTestHelper.getNode(helperNodeId)
          helperNode.on('input', function (msg) {
            testHelpers.forwardOnError(function () {
              msg.should.have.property('payload', expectedResponsePayload)
              msg.should.have.property('dxlResponse').instanceOf(dxl.Response)
              msg.should.have.propertyByPath('dxlResponse',
                'payload').equal(expectedResponsePayload)
              msg.should.have.property('dxlMessage').equal(msg.dxlResponse)
              msg.should.not.have.property('dxlError')
              done()
            }, done)
          })
        }, done)
    })
  })

  context('when payloadType set to bin', function () {
    it('should be sent properly through the DXL fabric', function (done) {
      const testFlows = baseTestFlows.slice()
      testFlows.push({
        id: requestNodeId,
        type: 'dxl-core-request',
        topic: '',
        returnType: 'bin',
        client: clientNodeId,
        wires: [[helperNodeId]]
      })

      testFlows.push({
        id: 'dxl.setTopicId',
        func: 'msg.dxlTopic = "/dxl-service-test/bin"; return msg;',
        type: 'function',
        outputs: 1,
        wires: [[requestNodeId]]
      })

      const requestPayload = Buffer.from([0x01, 0xD1, 0x9A])
      testFlows.push(testHelpers.getInjectNodeConfig('[1,209,154]',
        'dxl.setTopicId', 'bin'))

      testHelpers.loadNodeRed(nodesToLoad, testFlows,
        function () {
          const helperNode = nodeRedTestHelper.getNode(helperNodeId)
          helperNode.on('input', function (msg) {
            testHelpers.forwardOnError(function () {
              msg.should.have.property('payload',
                Buffer.concat([requestPayload, Buffer.from([32])]))
              done()
            }, done)
          })
        }, done)
    })
  })

  context('when payloadType set to obj', function () {
    it('should be sent properly through the DXL fabric', function (done) {
      const testFlows = baseTestFlows.slice()
      testFlows.push({
        id: requestNodeId,
        type: 'dxl-core-request',
        topic: '/dxl-service-test/obj',
        returnType: 'obj',
        client: clientNodeId,
        wires: [[helperNodeId]]
      })

      testFlows.push({
        id: 'dxl.setTopicId',
        func: 'msg.dxlTopic = "/should/be/overridden"; return msg;',
        type: 'function',
        outputs: 1,
        wires: [[requestNodeId]]
      })

      const requestPayload = { hello: 'how are you', fine: 'thanks' }
      testFlows.push(testHelpers.getInjectNodeConfig(
        JSON.stringify(requestPayload), 'dxl.setTopicId', 'obj'))

      testHelpers.loadNodeRed(nodesToLoad, testFlows,
        function () {
          const helperNode = nodeRedTestHelper.getNode(helperNodeId)
          helperNode.on('input', function (msg) {
            testHelpers.forwardOnError(function () {
              msg.should.have.property('payload', {
                hello: 'how are you',
                fine: 'thanks',
                other: 'added by function'
              })
              done()
            }, done)
          })
        }, done)
    })
  })

  context('when request payload is malformed', function () {
    it('should send an error response through the DXL fabric', function (done) {
      const testFlows = baseTestFlows.slice()
      testFlows.push({
        id: requestNodeId,
        type: 'dxl-core-request',
        topic: '/dxl-service-test/obj',
        returnType: 'obj',
        client: clientNodeId,
        wires: [[helperNodeId]],
        z: flowTabId
      })

      const requestPayload = 'malformed json'
      testFlows.push(testHelpers.getInjectNodeConfig(requestPayload,
        requestNodeId, 'txt'))

      testHelpers.loadNodeRed(nodesToLoad, testFlows,
        function () {
          const helperNode = nodeRedTestHelper.getNode(helperNodeId)
          helperNode.on('input', function (msg) {
            testHelpers.forwardOnError(function () {
              msg.should.have.propertyByPath(
                'error', 'message').match(/malformed json/)
              msg.should.have.propertyByPath(
                'error', 'source', 'type').equal('dxl-core-request')
              msg.should.have.propertyByPath('dxlResponse',
                'errorMessage').match(/malformed json/)
              msg.should.have.property('dxlMessage').equal(msg.dxlResponse)
              done()
            }, done)
          })
        }, done)
    })
  })

  context('when a node handling a service request generates an error',
    function () {
      it('should send an error response through the DXL fabric',
        function (done) {
          const testFlows = baseTestFlows.slice()
          testFlows.push({
            id: requestNodeId,
            type: 'dxl-core-request',
            topic: '/dxl-service-test/error',
            returnType: 'obj',
            client: clientNodeId,
            wires: [[helperNodeId]],
            z: flowTabId
          })

          const requestPayload = {
            errorMessage: 'really bad error',
            errorCode: 95
          }
          testFlows.push(testHelpers.getInjectNodeConfig(requestPayload,
            requestNodeId, 'obj'))

          testHelpers.loadNodeRed(nodesToLoad, testFlows,
            function () {
              const helperNode = nodeRedTestHelper.getNode(helperNodeId)
              helperNode.on('input', function (msg) {
                testHelpers.forwardOnError(function () {
                  msg.should.have.propertyByPath(
                    'error', 'message').match(/really bad error/)
                  msg.should.have.propertyByPath(
                    'error', 'source', 'type').equal('dxl-core-request')
                  msg.should.have.propertyByPath('dxlError', 'code').equal(95)
                  msg.should.have.propertyByPath('dxlResponse',
                    'errorCode').equal(95)
                  msg.should.have.propertyByPath('dxlResponse',
                    'errorMessage').equal('really bad error')
                  msg.should.have.property('dxlMessage').equal(msg.dxlResponse)
                  done()
                }, done)
              })
            }, done
          )
        }
      )
    }
  )

  context('when request cannot decode a response', function () {
    it('should generate a catchable error', function (done) {
      const testFlows = baseTestFlows.slice()
      testFlows.push({
        id: requestNodeId,
        type: 'dxl-core-request',
        topic: '/dxl-service-test/txt',
        returnType: 'obj',
        client: clientNodeId,
        wires: [[helperNodeId]],
        z: flowTabId
      })

      const requestPayload = 'not a json string'
      testFlows.push(testHelpers.getInjectNodeConfig(requestPayload,
        requestNodeId, 'txt'))

      testHelpers.loadNodeRed(nodesToLoad, testFlows,
        function () {
          const helperNode = nodeRedTestHelper.getNode(helperNodeId)
          helperNode.on('input', function (msg) {
            testHelpers.forwardOnError(function () {
              msg.should.have.propertyByPath(
                'error', 'message').match(/txt is: not a json string/)
              msg.should.have.propertyByPath(
                'error', 'source', 'type').equal('dxl-core-request')
              msg.should.have.property('dxlResponse').instanceOf(dxl.Response)
              msg.should.have.property('dxlMessage').equal(msg.dxlResponse)
              done()
            }, done)
          })
        }, done)
    })
  })

  context('when a request is made to an unregistered service',
    function () {
      it('should generate a catchable error',
        function (done) {
          const testFlows = baseTestFlows.slice()
          testFlows.push({
            id: requestNodeId,
            type: 'dxl-core-request',
            topic: '/dxl-service-test/not-found',
            returnType: 'obj',
            client: clientNodeId,
            wires: [[helperNodeId]],
            z: flowTabId
          })

          const requestPayload = {}
          testFlows.push(testHelpers.getInjectNodeConfig(requestPayload,
            requestNodeId, 'obj'))

          testHelpers.loadNodeRed(nodesToLoad, testFlows,
            function () {
              const helperNode = nodeRedTestHelper.getNode(helperNodeId)
              helperNode.on('input', function (msg) {
                testHelpers.forwardOnError(function () {
                  msg.should.have.propertyByPath(
                    'error', 'source', 'type').equal('dxl-core-request')
                  msg.should.have.propertyByPath('dxlError',
                    'code').equal(dxl.ResponseErrorCode.SERVICE_UNAVAILABLE)
                  msg.should.have.propertyByPath('dxlResponse',
                    'errorCode').equal(-2147483647)
                  msg.should.have.property('dxlMessage').equal(msg.dxlResponse)
                  done()
                }, done)
              })
            }, done
          )
        }
      )
    }
  )
})
