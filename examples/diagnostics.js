const { OBD2Client, listSerialPorts } = require('../dist/index');

async function diagnosticsExample() {
  try {
    // List available ports
    const ports = await listSerialPorts();
    if (ports.length === 0) {
      console.log('No serial ports found');
      return;
    }

    const client = new OBD2Client({
      type: 'serial',
      port: ports[0].path,
      baudRate: 38400
    });

    console.log('Connecting for diagnostic scan...');
    await client.connect();

    // Get adapter information
    const adapterInfo = client.getAdapterInfo();
    console.log('\nAdapter Information:');
    console.log('Protocol:', adapterInfo?.protocol);
    console.log('Version:', adapterInfo?.version);
    console.log('Device:', adapterInfo?.device);

    // Get vehicle information
    console.log('\nVehicle Information:');
    const vehicleInfo = await client.getVehicleInfo();
    Object.entries(vehicleInfo).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

    // Test all available commands
    console.log('\nTesting available commands...');
    const commands = client.getAvailableCommands();
    const results = [];

    for (const command of commands) {
      try {
        const result = await client.query(command);
        results.push({
          command,
          success: true,
          value: result.value,
          unit: result.unit
        });
        console.log(`✓ ${command}: ${result.value} ${result.unit || ''}`);
      } catch (error) {
        results.push({
          command,
          success: false,
          error: error.message
        });
        console.log(`✗ ${command}: ${error.message}`);
      }
      
      // Small delay between commands
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('\n' + '='.repeat(50));
    console.log('DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total commands tested: ${results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\nSupported parameters:');
      successful.forEach(r => {
        console.log(`  - ${r.command}: ${r.value} ${r.unit || ''}`);
      });
    }

    if (failed.length > 0) {
      console.log('\nUnsupported parameters:');
      failed.forEach(r => {
        console.log(`  - ${r.command}: ${r.error}`);
      });
    }

    await client.disconnect();
    console.log('\nDiagnostic scan completed');

  } catch (error) {
    console.error('Diagnostic error:', error.message);
  }
}

diagnosticsExample();
