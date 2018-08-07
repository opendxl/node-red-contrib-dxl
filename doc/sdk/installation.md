### Prerequisites

To use the Node-RED OpenDXL contribution package, the following prerequisites
must be satisfied:    

* Node-RED must be installed. For more information, see
  <https://nodered.org/docs/getting-started/installation>.
  
  > **Note**: In order to be able to import examples properly from the Node-RED
  > UI, version 0.18.0 or newer of Node-RED should be installed.

* OpenDXL JavaScript Client (Node.js) library installed
  * <https://github.com/opendxl/opendxl-client-javascript>

  > **Note**: When you follow either of the installation approaches in the
  > next section, the OpenDXL JavaScript Client should be installed
  > automatically. You do not need to explicitly install the OpenDXL
  > JavaScript Client library before installing the Node-RED OpenDXL
  > contribution package.

* The OpenDXL JavaScript Client (Node.js) prerequisites must be satisfied
  * <https://opendxl.github.io/opendxl-client-javascript/jsdoc/tutorial-installation.html>

### Installation

The Node-RED OpenDXL contribution package can be installed either through
Node-RED itself or from the command line on the Node-RED server. For simplicity,
you may choose the Node-RED based installation approach. See the following
sections for information on both installation approaches.

#### Node-RED Based Installation

1. Browse to your Node-RED server.

1. In the upper-right corner, press the side menu button.

1. Choose the `Manage palette` option in the menu drop-down list.

1. From the `Palette` user settings tab, click on the `Install` tab.

1. In the `search modules` text box, enter `dxl`.

1. Next to the entry for `@opendxl/node-red-contrib-dxl` in the search results,
   press the `install` button.
   
1. On the `Installing` confirmation dialog, press the `Install` button.   
   
   A dialog containing text like the following should appear when the
   installation is complete:
   
   ```
   Nodes added to palette:
   
   * dxl
   ```

1. Click on the `Close` button to close the `User Settings` tab.

#### Command Line Installation

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

After the installation is complete, restart Node-RED and browse to your
Node-RED server.

#### Confirming the Installation Result

After the installation is complete, you should see several "dxl" nodes in the
left column:

![DXL Nodes](images/dxl-nodes.png)

For more information, see the
[Node-RED Configuration](https://nodered.org/docs/configuration) documentation.
