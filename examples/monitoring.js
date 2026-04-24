const { OBD2Client } = require('../dist/index');

async function monitoringExample() {
  const client = new OBD2Client({
    type: 'serial',
    port: '/dev/ttyUSB0', // Change this to your actual port
    baudRate: 38400,
    timeout: 5000
  });

  try {
    console.log('Connecting to OBD2 adapter...');
    await client.connect();
    console.log('Connected successfully');

    // Parameters to monitor
    const parameters = [
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'COOLANT_TEMP',
      'ENGINE_LOAD',
      'THROTTLE_POS',
      'INTAKE_PRESSURE'
    ];

    console.log('Starting real-time monitoring...');
    console.log('Press Ctrl+C to stop\n');

    // Monitor loop
    const monitor = async () => {
      while (client.isConnected()) {
        try {
          const timestamp = new Date().toISOString();
          console.log(`\n[${timestamp}] Vehicle Data:`);
          console.log(''.padEnd(50, '='));

          for (const param of parameters) {
            try {
              const result = await client.query(param);
              const value = typeof result.value === 'number' 
                ? result.value.toFixed(1) 
                : result.value;
              console.log(`${param.padEnd(20)}: ${value} ${result.unit || ''}`);
            } catch (error) {
              console.log(`${param.padEnd(20)}: N/A (${error.message})`);
            }
          }

          // Wait 2 seconds before next reading
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Monitoring error:', error.message);
          break;
        }
      }
    };

    // Start monitoring
    monitor();

    // Handle Ctrl+C gracefully
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await client.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

monitoringExample();
