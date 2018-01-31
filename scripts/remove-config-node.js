#!/usr/bin/env node

'use strict'

var fs = require('fs')
var os = require('os')
var path = require('path')
var program = require('commander')

var inputFilePath = path.join(os.homedir(), '.node-red',
  'flows_' + os.hostname() + '.json')

program
  .arguments('remove-config-node [input-file]')
  .description('Remove the DXL client config node and associated references ' +
    'from a flows JSON file')
  .option('-o, --output-file [file]', 'file to output transformed flows into')
  .action(function (inputFile, cmd) {
    inputFilePath = inputFile
  })
  .parse(process.argv)

if (!fs.existsSync(inputFilePath)) {
  console.error('input file does not exist: ' + inputFilePath + ', exiting...')
  process.exit(1)
}

var inputNodes = JSON.parse(fs.readFileSync(inputFilePath))
var outputNodes = []

inputNodes.forEach(function (node) {
  if (node.type !== 'dxl-client') {
    if (node.client) {
      node.client = ''
    }
    outputNodes.push(node)
  }
})

var outputJson = JSON.stringify(outputNodes, null, 4) + '\n'
if (program.outputFile) {
  fs.writeFileSync(program.outputFile, outputJson)
  console.log('Wrote modified file to: ' + program.outputFile)
} else {
  console.log(outputJson)
}
