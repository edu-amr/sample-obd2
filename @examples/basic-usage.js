const { OBD2Client, listSerialPorts } = require('../dist/index');

async function basicExample() {
  try {
    // List available serial ports
    console.log('Available serial ports:');
    const ports = await listSerialPorts();
    ports.forEach(port => {
      console.log(`  - ${port.path} (${port.manufacturer || 'Unknown'})`);
    });

    if (ports.length === 0) {
      console.log('No serial ports found. Please connect your OBD2 adapter.');
      return;
    }

    // Create OBD2 client with first available port
    const client = new OBD2Client({
      type: 'serial',
      port: ports[0].path,
      baudRate: 38400,
      timeout: 5000
    });

    // Set up event listeners
    client.on('connected', () => {
      console.log('Connected to OBD2 adapter');
    });

    client.on('ready', (adapterInfo) => {
      console.log('Adapter ready:', adapterInfo);
    });

    client.on('error', (error) => {
      console.error('OBD2 Error:', error.message);
    });

    client.on('response', (response) => {
      console.log(`${response.command}: ${response.value} ${response.unit || ''}`);
    });

    // Connect to the adapter
    console.log('Connecting to OBD2 adapter...');
    await client.connect();

    // Get vehicle information
    console.log('\nGetting vehicle information...');
    const vehicleInfo = await client.getVehicleInfo();
    console.log('Vehicle Info:', vehicleInfo);

    // Get supported PIDs
    console.log('\nGetting supported PIDs...');
    const supportedPids = await client.getSupportedPids();
    console.log('Supported PIDs:', supportedPids.slice(0, 10), '...'); // Show first 10

    // Query some basic parameters
    console.log('\nQuerying basic parameters...');
    
    try {
      const rpm = await client.getRPM();
      console.log(`Engine RPM: ${rpm}`);
    } catch (error) {
      console.log('RPM not available:', error.message);
    }

    try {
      const speed = await client.getSpeed();
      console.log(`Vehicle Speed: ${speed} km/h`);
    } catch (error) {
      console.log('Speed not available:', error.message);
    }

    try {
      const coolantTemp = await client.getCoolantTemperature();
      console.log(`Coolant Temperature: ${coolantTemp}°C`);
    } catch (error) {
      console.log('Coolant temperature not available:', error.message);
    }

    try {
      const engineLoad = await client.getEngineLoad();
      console.log(`Engine Load: ${engineLoad}%`);
    } catch (error) {
      console.log('Engine load not available:', error.message);
    }

    try {
      const throttlePos = await client.getThrottlePosition();
      console.log(`Throttle Position: ${throttlePos}%`);
    } catch (error) {
      console.log('Throttle position not available:', error.message);
    }

    // Query multiple parameters at once
    console.log('\nQuerying multiple parameters...');
    const results = await client.queryMultiple([
      'ENGINE_RPM',
      'VEHICLE_SPEED', 
      'COOLANT_TEMP',
      'ENGINE_LOAD'
    ]);

    results.forEach(result => {
      console.log(`${result.command}: ${result.value} ${result.unit || ''}`);
    });

    // Disconnect
    console.log('\nDisconnecting...');
    await client.disconnect();
    console.log('Disconnected successfully');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
basicExample();
