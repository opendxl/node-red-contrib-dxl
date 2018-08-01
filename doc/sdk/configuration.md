This page demonstrates how to setup a DXL client configuration for Node-RED. The
configuration created by following the steps on this page can be used in
conjunction with the other samples in the Node-RED OpenDXL contribution package.

Prior to setting up a DXL client configuration in Node-RED, make sure you have
completed the [client provisioning](https://opendxl.github.io/opendxl-client-javascript/jsdoc/tutorial-provisioning.html)
step.

In order to connect to the DXL fabric, each of the OpenDXL nodes need to be
associated with a `dxl client`
[configuration node](https://nodered.org/docs/creating-nodes/config-nodes). Each
`dxl client` node is associated with a separate connection to the DXL fabric.
The same `dxl client` node can be associated with each DXL node which is
intended to share a client connection. Multiple client configuration nodes can
be created, for example, in order to bridge communication among different DXL
fabrics.

The examples in the Node-RED OpenDXL contribution package do not include their
own `dxl client` configuration node. You can either:

* Import the sample configuration included in the Node-RED OpenDXL contribution
  package before importing any of the examples.
* Import an example flow first and manually create a configuration node from
  within the edit dialog of one of the DXL nodes imported from the example.
  
With the sample configuration approach, the client node will be automatically
associated with DXL nodes imported from other example flows later on. The sample
configuration approach, therefore, may be a bit simpler for getting flows up and
running.
   
### Importing the Sample Configuration

To import the `basic-config-example`, perform the following steps:

1. In the upper-right corner of the Node-RED UI, press the `side menu` button. 

1. In the menu drop-down list, select
   `Import` &rarr; `Examples` &rarr; `dxl` &rarr; `basic-config-example`.
   
1. To confirm that the configuration node was loaded properly, choose the
   `Configuration nodes` item under the `side menu` button. An item similar
   to the following should appear under the `config` tab on the right-side
   of the screen:
   
   ![Import Config Node](images/import-config-node.png)
   
1. Double-click the `client` node to open an edit window:

   ![Edit Config Node](images/edit-config-node.png)

   The value in the `Config file` text box determines the DXL client
   configuration file that the client node will use to determine how to connect
   to the DXL fabric. Change this value to the location of the
   `dxlclient.config` file which you generated during the
   [provisioning step](https://opendxl.github.io/opendxl-client-javascript/jsdoc/tutorial-provisioning.html)
   and press the `Update` button to commit the change.

### Manually Creating a Configuration Node
   
A DXL client configuration node can be created manually from within the edit
dialog of another DXL node. For example, you could do the following:

1. Drag a `dxl event subscriber` node from the `Input` palette into the flow
   panel.

   ![Add Event Subscriber Node](images/add-event-subscriber-node.png)

1. Double-click the `dxl subscriber event` node to open an edit window:

   ![Edit Event Subscriber Node No Client](images/edit-event-subscriber-node-no-client.png)

1. Click on the `pencil` icon to the right of the `Add new dxl-client...`
   dropdown entry. This should open up an edit dialog box for a new client
   configuration node. Enter the location of the DXL configuration file on your
   Node-RED server and a `Name` that Node-RED can use to associate with the
   configuration:
   
   ![Add Config Node](images/add-config-node.png)
   
1. Press the `Add` button to create the new configuration node. The
   configuration node will automatically be associated with the new event
   subscriber node:

   ![Edit Event Subscriber Node With Client](images/edit-event-subscriber-node-with-client.png)

   Note that the `Client` field on each DXL node is a drop-down list box. A
   separate list item will appear for each client configuration node which has
   been defined. A DXL node may be associated with only one client configuration
   node.
