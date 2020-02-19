'use strict'

require('should')
var fs = require('fs')
var path = require('path')
var sinon = require('sinon')
var DxlConfig = require('@opendxl/dxl-client').Config
var bodyParser = require('body-parser')

var testNode = require('../../nodes/dxl-client')
var nodeRedTestHelper = require('node-red-node-test-helper')
var testHelpers = require('./test-helpers')

describe('dxl-client node', function () {
  before(function (done) {
    nodeRedTestHelper.startServer(done)
  })

  afterEach(function () {
    if (fs.existsSync.restore) {
      fs.existsSync.restore()
    }
    if (DxlConfig.provisionConfig.restore) {
      DxlConfig.provisionConfig.restore()
    }
    nodeRedTestHelper.unload()
  })

  after(function (done) {
    nodeRedTestHelper.stopServer(done)
  })

  it('should be loaded', function (done) {
    var testFlows = [
      {
        configFile: testHelpers.getTestClientConfigFile(),
        id: 'dxl.clientId',
        name: 'client',
        type: 'dxl-client',
        keepAliveInterval: '123',
        reconnectDelay: '16'
      }
    ]
    testHelpers.loadNodeRed(testNode, testFlows, function () {
      var clientNode = nodeRedTestHelper.getNode('dxl.clientId')
      clientNode.should.have.property('name', 'client')
      var clientConfig = clientNode.dxlClient.config
      clientConfig.keepAliveInterval.should.be.equal(123)
      clientConfig.reconnectDelay.should.be.equal(16)
      done()
    }, done)
  })

  it('should return defaults via HTTP request', function (done) {
    testHelpers.loadNodeRed(testNode, [], function () {
      nodeRedTestHelper.request().get(
        '/dxl-client/defaults').expect(200, {configDir: 'dxl'}).end(done)
    }, done)
  })

  context('provision config HTTP request', function () {
    it('should return 200 for success', function (done) {
      var provisionConfigStub = sinon.stub(
        DxlConfig, 'provisionConfig').callsFake(
        function (configDir, commonOrCsrFileName, hostInfo, options) {
          options.doneCallback()
        }
      )
      var provisionConfigParams = {
        configDir: '/the/confdir',
        commonOrCsrFileName: 'client',
        hostInfo: {
          hostname: 'myhost',
          user: 'myuser',
          password: 'mypass'
        }
      }
      testHelpers.loadNodeRed(function (RED) {
        RED.httpAdmin.use(bodyParser.json())
        testNode(RED)
      }, [], function () {
        nodeRedTestHelper.request()
          .post('/dxl-client/provision-config')
          .send(provisionConfigParams)
          .expect(200)
          .end(function (error) {
            provisionConfigStub.calledWith(
              provisionConfigParams.configDir,
              provisionConfigParams.commonOrCsrFileName,
              provisionConfigParams.hostInfo
            ).should.be.true()
            provisionConfigStub.restore()
            done(error)
          })
      }, done)
    })

    it('should return error for failure', function (done) {
      var errorMessage = 'Bad provision result'
      var provisionConfigStub = sinon.stub(
        DxlConfig, 'provisionConfig').callsFake(
        function (configDir, commonOrCsrFileName, hostInfo, options) {
          options.doneCallback(new Error(errorMessage))
        }
      )
      testHelpers.loadNodeRed(function (RED) {
        RED.httpAdmin.use(bodyParser.json())
        testNode(RED)
      }, [], function () {
        nodeRedTestHelper.request()
          .post('/dxl-client/provision-config')
          .send({
            configDir: '/the/confdir',
            commonOrCsrFileName: 'client',
            hostInfo: {
              hostname: 'myhost',
              user: 'myuser',
              password: 'mypass'
            }
          })
          .expect(500, errorMessage)
          .end(function (error) {
            provisionConfigStub.restore()
            done(error)
          })
      }, done)
    })
  })

  context('provisioned files HTTP request', function () {
    it('should return list of existing files on server', function (done) {
      var configDir = '/the/confdir'
      var fsExistsStub = sinon.stub(fs, 'existsSync').returns(true)
      testHelpers.loadNodeRed(testNode, [], function () {
        nodeRedTestHelper.request()
          .get('/dxl-client/provisioned-files?configDir=' + configDir)
          .expect(200, ['ca-bundle.crt', 'client.crt', 'client.csr',
            'client.key', 'dxlclient.config']
          )
          .end(function (error) {
            fsExistsStub.calledWith(configDir).should.be.true()
            fsExistsStub.calledWith(
              path.join(configDir, 'client.key')).should.be.true()
            fsExistsStub.restore()
            done(error)
          })
      }, done)
    })

    it('should return empty list when no files exist on server',
      function (done) {
        var configDir = '/the/confdir'
        var fsExistsStub = sinon.stub(fs, 'existsSync').returns(false)
        testHelpers.loadNodeRed(testNode, [], function () {
          nodeRedTestHelper.request()
            .get('/dxl-client/provisioned-files?configDir=' + configDir)
            .expect(200, [])
            .end(function (error) {
              fsExistsStub.restore()
              done(error)
            })
        }, done)
      }
    )
  })
})
