// Exemplo de uso via WiFi (ELM327 WiFi)
// Execute: npx ts-node examples/wifi-example.ts

const { OBD2Client } = require('../dist/index');

async function main() {
  const client = new OBD2Client({
    type: 'wifi',
    host: '192.168.0.10', // IP do ELM327 WiFi — ajuste se necessário
    port: 35000,
    timeout: 5000,
  });

  client.on('connected', () => console.log('✅ Conectado ao ELM327 WiFi'));
  client.on('ready', (info) => console.log('🚗 Adaptador pronto:', info));
  client.on('error', (err) => console.error('❌ Erro:', err.message));
  client.on('disconnected', () => console.warn('🔌 Desconectado'));

  try {
    console.log('Conectando...');
    await client.connect();

    // Dados em tempo real
    const readings = await client.queryMultiple([
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'COOLANT_TEMP',
      'ENGINE_LOAD',
      'THROTTLE_POS',
      'FUEL_LEVEL',
    ]);

    console.log('\n📊 Leituras do veículo:');
    for (const r of readings) {
      const val = typeof r.value === 'number' ? r.value.toFixed(1) : r.value;
      console.log(`  ${r.command.padEnd(20)}: ${val} ${r.unit || ''}`);
    }

    // Info do veículo
    const info = await client.getVehicleInfo();
    console.log('\n🔍 Info do veículo:', info);

    await client.disconnect();
    console.log('\n✅ Desconectado com sucesso');
  } catch (err) {
    console.error('Erro fatal:', err.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => process.exit(0));
main();
