### Prerequisites

To use the Node-RED OpenDXL contribution package, the following prerequisites
must be satisfied:    

* Node-RED must be installed.

  The [OpenDXL Node-RED Docker](https://github.com/opendxl/opendxl-node-red-docker)
  repository provides instructions on how to create a Node-RED container in
  [Docker](https://www.docker.com/), with the Node-RED OpenDXL contribution
  package installed automatically.

  For more information on other Node-RED installation approaches, see
  <https://nodered.org/docs/getting-started/installation>.
  
  > **Note**: In order to be able to import examples properly from the Node-RED
  > UI, version 0.18.0 or newer of Node-RED should be installed.

* OpenDXL JavaScript Client (Node.js) library installed
  * <https://github.com/opendxl/opendxl-client-javascript>

  > **Note**: When you follow any of the installation approaches in the
  > next section, the OpenDXL JavaScript Client should be installed
  > automatically. You do not need to explicitly install the OpenDXL
  > JavaScript Client library before installing the Node-RED OpenDXL
  > contribution package.

* The OpenDXL JavaScript Client (Node.js) prerequisites must be satisfied
  * <https://opendxl.github.io/opendxl-client-javascript/jsdoc/tutorial-installation.html>

* Node.js 4.0 or higher installed.

### Installation

The Node-RED OpenDXL contribution package can be installed via the following
approaches:

* OpenDXL Node-RED Docker image

  With this approach, the Node-RED OpenDXL contribution package is installed
  automatically as a new Docker container is created. For more information, see
  the [OpenDXL Node-RED Docker](https://github.com/opendxl/opendxl-node-red-docker)
  repository.

* Node-RED Based

  With this approach, the Node-RED OpenDXL contribution package is installed
  from within Node-RED itself. See the
  [Node-RED Based Installation](#node-red-based-installation) section below for
  more information.

* Command Line Installation

  With this approach, the Node-RED OpenDXL contribution package is installed
  via [npm](https://docs.npmjs.com/) from the command-line on the host where the
  Node-RED server is running. See the
  [Command Line Installation](#command-line-installation) section below for more
  information.

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
   
   * dxl-client
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
