# obd-node

A comprehensive Node.js library for communicating with OBD2 (On-Board Diagnostics) systems in vehicles. This library supports both serial and Bluetooth connections to OBD2 adapters and provides an easy-to-use API for reading vehicle parameters.

## Features

- 🚗 **Universal OBD2 Support**: Compatible with all OBD2-compliant vehicles (1996+)
- 🔌 **Multiple Connection Types**: Serial (USB/RS232) and Bluetooth support
- 📊 **Comprehensive Parameter Set**: 20+ predefined OBD2 parameters with proper decoders
- 🔄 **Real-time Monitoring**: Continuous data streaming capabilities
- 🛠️ **Adapter Management**: Automatic adapter initialization and configuration
- 📱 **Cross-platform**: Works on Windows, macOS, and Linux
- 🎯 **TypeScript Support**: Full TypeScript definitions included
- 🧪 **Well Tested**: Comprehensive test suite

## Installation

```bash
npm install obd-node
```

## Quick Start

### Serial Connection Example

```javascript
const { OBD2Client, listSerialPorts } = require('obd-node');

async function main() {
  // List available serial ports
  const ports = await listSerialPorts();
  console.log('Available ports:', ports);

  // Create client
  const client = new OBD2Client({
    type: 'serial',
    port: '/dev/ttyUSB0', // or 'COM3' on Windows
    baudRate: 38400
  });

  // Connect and initialize
  await client.connect();

  // Read some basic parameters
  const rpm = await client.getRPM();
  const speed = await client.getSpeed();
  const temp = await client.getCoolantTemperature();

  console.log(`RPM: ${rpm}`);
  console.log(`Speed: ${speed} km/h`);
  console.log(`Coolant: ${temp}°C`);

  await client.disconnect();
}

main().catch(console.error);
```

### TypeScript Example

```typescript
import { OBD2Client, ConnectionConfig, OBD2Response } from 'obd-node';

const config: ConnectionConfig = {
  type: 'serial',
  port: '/dev/ttyUSB0',
  baudRate: 38400,
  timeout: 5000
};

const client = new OBD2Client(config);

client.on('connected', () => console.log('Connected!'));
client.on('response', (response: OBD2Response) => {
  console.log(`${response.command}: ${response.value} ${response.unit}`);
});

await client.connect();
const engineLoad = await client.getEngineLoad();
```

## API Documentation

### OBD2Client

#### Constructor

```javascript
const client = new OBD2Client(config);
```

**Config Options:**
- `type`: `'serial' | 'bluetooth'` - Connection type
- `port`: `string` - Serial port path (for serial connections)
- `address`: `string` - Bluetooth address (for Bluetooth connections)
- `baudRate`: `number` - Serial baud rate (default: 38400)
- `timeout`: `number` - Command timeout in milliseconds (default: 5000)

#### Methods

##### Connection Management

```javascript
await client.connect()           // Connect to adapter
await client.disconnect()        // Disconnect from adapter
client.isConnected()            // Check connection status
client.getAdapterInfo()         // Get adapter information
```

##### Data Query Methods

```javascript
// Generic query methods
await client.query(commandName)         // Query by command name
await client.queryPid(pid)             // Query by PID
await client.queryMultiple([commands]) // Query multiple parameters

// Convenience methods
await client.getRPM()                  // Engine RPM
await client.getSpeed()                // Vehicle speed (km/h)
await client.getCoolantTemperature()   // Coolant temperature (°C)
await client.getEngineLoad()           // Engine load (%)
await client.getFuelLevel()            // Fuel level (%)
await client.getThrottlePosition()     // Throttle position (%)
```

##### Information Methods

```javascript
await client.getVehicleInfo()      // Get vehicle information
await client.getSupportedPids()    // Get supported PIDs
client.getAvailableCommands()      // Get all available commands
```

#### Events

```javascript
client.on('connected', () => {})           // Connection established
client.on('disconnected', () => {})       // Connection lost
client.on('ready', (adapterInfo) => {})   // Adapter initialized
client.on('response', (response) => {})   // Data received
client.on('error', (error) => {})         // Error occurred
client.on('rawData', (data) => {})        // Raw data from adapter
```

### Available Commands

The library includes decoders for the following OBD2 parameters:

| Command | Description | Unit |
|---------|-------------|------|
| `ENGINE_LOAD` | Calculated engine load | % |
| `COOLANT_TEMP` | Engine coolant temperature | °C |
| `SHORT_FUEL_TRIM_1` | Short term fuel trim—Bank 1 | % |
| `LONG_FUEL_TRIM_1` | Long term fuel trim—Bank 1 | % |
| `INTAKE_PRESSURE` | Intake manifold absolute pressure | kPa |
| `ENGINE_RPM` | Engine speed | rpm |
| `VEHICLE_SPEED` | Vehicle speed | km/h |
| `TIMING_ADVANCE` | Timing advance | ° |
| `INTAKE_TEMP` | Intake air temperature | °C |
| `MAF_RATE` | Mass air flow sensor air flow rate | g/s |
| `THROTTLE_POS` | Throttle position | % |
| `O2_SENSOR_1` | Oxygen sensor 1 voltage | V |
| `OBD_STANDARDS` | OBD standards compliance | - |
| `RUNTIME` | Run time since engine start | seconds |
| `FUEL_LEVEL` | Fuel tank level | % |
| `BAROMETRIC_PRESSURE` | Absolute barometric pressure | kPa |
| `AMBIENT_TEMP` | Ambient air temperature | °C |
| `VIN` | Vehicle Identification Number | - |

### Utility Functions

```javascript
import { listSerialPorts, isBluetoothAvailable } from 'obd-node';

// List available serial ports
const ports = await listSerialPorts();

// Check if Bluetooth is available
const bluetoothAvailable = await isBluetoothAvailable();
```

## Hardware Compatibility

### Supported OBD2 Adapters

- **ELM327-based adapters** (USB, Bluetooth, WiFi)
- **OBDLink adapters**
- **UniCarScan adapters**
- **Generic OBD2 interfaces**

### Tested Adapters

- ELM327 USB
- ELM327 Bluetooth
- Vgate iCar Pro Bluetooth
- BAFX Products Bluetooth OBD2

### Connection Types

#### Serial (USB/RS232)
- Most reliable connection method
- Typically uses `/dev/ttyUSB0` on Linux, `COM3` on Windows
- Standard baud rates: 9600, 38400, 115200

#### Bluetooth
- Convenient wireless connection
- Supported in web browsers with Web Bluetooth API
- Requires Bluetooth-enabled OBD2 adapter

## Examples

### Real-time Monitoring

```javascript
const { OBD2Client } = require('obd-node');

const client = new OBD2Client({
  type: 'serial',
  port: '/dev/ttyUSB0'
});

await client.connect();

// Monitor key parameters every 2 seconds
setInterval(async () => {
  try {
    const data = await client.queryMultiple([
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'COOLANT_TEMP',
      'ENGINE_LOAD'
    ]);
    
    console.log('Vehicle Data:', data);
  } catch (error) {
    console.error('Monitoring error:', error.message);
  }
}, 2000);
```

### Error Handling

```javascript
const client = new OBD2Client(config);

client.on('error', (error) => {
  if (error.code === 'CONNECTION_ERROR') {
    console.log('Connection lost, attempting to reconnect...');
    // Implement reconnection logic
  } else if (error.code === 'TIMEOUT_ERROR') {
    console.log('Command timed out');
  } else if (error.code === 'PROTOCOL_ERROR') {
    console.log('Protocol error:', error.message);
  }
});

try {
  await client.connect();
} catch (error) {
  console.error('Failed to connect:', error.message);
}
```

### Custom Command Decoder

```javascript
import { OBD2Client, OBD2Command } from 'obd-node';

// Define a custom command
const customCommand: OBD2Command = {
  name: 'CUSTOM_PARAM',
  pid: '0150', // Example PID
  description: 'Custom parameter',
  decoder: (data: string) => {
    // Custom decoding logic
    const value = parseInt(data.substring(4, 6), 16);
    return value * 0.5; // Example conversion
  },
  unit: 'custom_unit'
};

const client = new OBD2Client(config);
await client.connect();

// Use custom command
const response = await client.queryCommand(customCommand);
console.log(`Custom param: ${response.value} ${response.unit}`);
```

## Troubleshooting

### Common Issues

1. **Permission Denied (Linux/macOS)**
   ```bash
   sudo chmod 666 /dev/ttyUSB0
   # or add user to dialout group
   sudo usermod -a -G dialout $USER
   ```

2. **Port Not Found**
   - Check if adapter is properly connected
   - Use `listSerialPorts()` to find available ports
   - Try different USB ports

3. **Adapter Not Responding**
   - Verify adapter compatibility (ELM327 recommended)
   - Check baud rate settings
   - Ensure vehicle is running or ignition is on

4. **Bluetooth Connection Issues**
   - Pair adapter with system first
   - Check if adapter is already connected to another device
   - Verify Bluetooth permissions

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const client = new OBD2Client(config);

client.on('rawData', (data) => {
  console.log('Raw data:', data);
});

client.on('error', (error) => {
  console.error('Debug error:', error);
});
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Setup

```bash
git clone https://github.com/jacobross/obd-node.git
cd obd-node
npm install
npm run build
npm test
```

### Running Examples

```bash
npm run build
node examples/basic-usage.js
node examples/monitoring.js
node examples/diagnostics.js
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on the ELM327 command set
- Inspired by the OBD2 protocol specifications
- Thanks to the automotive diagnostics community

## Related Projects

- [python-OBD](https://github.com/brendan-w/python-OBD) - Python OBD2 library
- [node-obd](https://github.com/EricSmekens/node-obd) - Another Node.js OBD library
- [elm327-emulator](https://github.com/Ircama/ELM327-emulator) - ELM327 emulator for testing
