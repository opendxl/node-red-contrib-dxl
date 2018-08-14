The Node-RED OpenDXL contribution package includes JSON documents with sample
Node-RED flows. To import samples into Node-RED, perform the following steps:

1. In the upper-right corner of the Node-RED UI, press the side menu button.

1. Select one of examples under
   `Import → Examples → dxl` in the menu drop-down list.

In order for the sample flows to execute properly, Node-RED must be able to
connect to a DXL fabric. For more information on connecting to a DXL fabric
from Node-RED, see the {@tutorial configuration} section.

See the following sections for an overview of each sample.

### Basic Config (basic-config-example)

This sample includes a DXL client configuration node with no additional flow
elements. This can be loaded in order to configure the connection parameters for
the DXL client before any flow-based examples which use the configuration have
been loaded. For more information, see the {@tutorial configuration} section.

### Basic Event (basic-event-example)

This sample demonstrates how to send and receive `Event` messages from the DXL
fabric from Node-RED.

### Basic Service (basic-service-example)

This sample demonstrates how to register a DXL service to receive `Request`
messages and send back `Response` messages from Node-RED.
