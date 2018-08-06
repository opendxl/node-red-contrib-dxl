### Prerequisites

To use the Node-RED OpenDXL contribution package, the following prerequisites
must be satisfied:    

* Node-RED must be installed. For more information, see
  <https://nodered.org/docs/getting-started/installation>.
  
  > **Note**: In order to be able to import examples properly from the Node-RED
  > UI, version 0.18.0 or newer of Node-RED should be installed.

* OpenDXL JavaScript Client (Node.js) library installed
  * <https://github.com/opendxl/opendxl-client-javascript>

* The OpenDXL JavaScript Client (Node.js) prerequisites must be satisfied
  * <https://opendxl.github.io/opendxl-client-javascript/jsdoc/tutorial-installation.html>

### Installation

Before installing the Node-RED OpenDXL contribution package, first navigate in a
command shell to the user directory which you have configured for Node-RED. The
`.node-red` directory under the user's `HOME` directory is the default user
directory for Node-RED.

For Mac and Linux-based operating systems, run the following command:

```sh
cd ~/.node-red
```

For Windows, run the following command:

```sh
cd %HOMEPATH%\.node-red
```

To install the library from a local tarball for a Mac or Linux-based operating
system, run the following command:

```sh
npm install ./lib/{@releasetarballname} --save
```

To install the library from a local tarball for Windows, run:

```sh
npm install .\lib\{@releasetarballname} --save
```

To install the library via the
[npm package registry](https://www.npmjs.com/package/@opendxl/node-red-contrib-dxl),
run the following command:

```sh
npm install @opendxl/node-red-contrib-dxl --save
```

After you restart Node-RED and browse to the Node-RED web interface, you should
see several "dxl" nodes in the left column:

![DXL Nodes](images/dxl-nodes.png)

For more information, see the
[Node-RED Configuration](https://nodered.org/docs/configuration) documentation.
