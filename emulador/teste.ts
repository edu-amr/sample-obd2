/**
 * Teste completo contra o emulador ELM327
 * Rode o emulador primeiro: npx ts-node emulator/elm327-emulator.ts
 * Depois rode este:         npx ts-node emulator/test-emulator.ts
 */

import { OBD2Client } from '../src';

const VERDE = '\x1b[32m';
const VERMELHO = '\x1b[31m';
const AMARELO = '\x1b[33m';
const RESET = '\x1b[0m';
const NEGRITO = '\x1b[1m';

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n${NEGRITO}=== Teste do cliente OBD2 contra o emulador ===${RESET}\n`);

  const client = new OBD2Client({
    type: 'wifi',
    host: '127.0.0.1',
    port: 35000,
    timeout: 5000,
  });

  client.on('connected', () => console.log(`${VERDE}✅ Conectado ao emulador${RESET}`));
  client.on('ready', (info) => {
    console.log(`${VERDE}🚗 Adaptador inicializado:${RESET}`);
    console.log(`   Versão:   ${info.version}`);
    console.log(`   Device:   ${info.device}`);
    console.log(`   Protocolo: ${info.protocol}\n`);
  });

  try {
    await client.connect();

    // ── Teste 1: PIDs individuais ──────────────────────────────────────────
    console.log(`${NEGRITO}── Leituras em tempo real ──${RESET}`);
    const pids = [
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'COOLANT_TEMP',
      'ENGINE_LOAD',
      'THROTTLE_POS',
      'FUEL_LEVEL',
      'INTAKE_TEMP',
      'MAF_RATE',
      'INTAKE_PRESSURE',
      'TIMING_ADVANCE',
      'RUNTIME',
    ];

    let passed = 0;
    for (const pid of pids) {
      try {
        const r = await client.query(pid);
        const val = typeof r.value === 'number' ? r.value.toFixed(1) : r.value;
        console.log(
          `  ${VERDE}✅${RESET} ${pid.padEnd(22)}: ${NEGRITO}${val}${RESET} ${r.unit || ''}`,
        );
        passed++;
      } catch (err: any) {
        console.log(`  ${VERMELHO}❌${RESET} ${pid.padEnd(22)}: ${err.message}`);
      }
    }

    // ── Teste 2: queryMultiple ─────────────────────────────────────────────
    console.log(`\n${NEGRITO}── queryMultiple ──${RESET}`);
    const multi = await client.queryMultiple(['ENGINE_RPM', 'VEHICLE_SPEED', 'COOLANT_TEMP']);
    console.log(`  ${VERDE}✅${RESET} ${multi.length} respostas recebidas simultaneamente`);

    // ── Teste 3: VIN ───────────────────────────────────────────────────────
    console.log(`\n${NEGRITO}── VIN ──${RESET}`);
    try {
      const vin = await client.query('VIN');
      console.log(`  ${VERDE}✅${RESET} VIN: ${vin.value}`);
    } catch (err: any) {
      console.log(`  ${AMARELO}⚠️${RESET}  VIN: ${err.message} (esperado em alguns clones)`);
    }

    // ── Teste 4: PIDs suportados ───────────────────────────────────────────
    console.log(`\n${NEGRITO}── PIDs suportados ──${RESET}`);
    const supportedPids = await client.getSupportedPids();
    console.log(`  ${VERDE}✅${RESET} ${supportedPids.length} PIDs suportados detectados`);
    console.log(`     ${supportedPids.slice(0, 12).join(', ')}...`);

    // ── Teste 5: Polling — 5 leituras de RPM ──────────────────────────────
    console.log(`\n${NEGRITO}── Polling RPM (5x) ──${RESET}`);
    for (let i = 0; i < 5; i++) {
      const r = await client.getRPM();
      console.log(`  [${i + 1}] RPM: ${r.toFixed(0)}`);
      await sleep(300);
    }

    // ── Resultado ─────────────────────────────────────────────────────────
    console.log(`\n${NEGRITO}─────────────────────────────────────${RESET}`);
    console.log(`${VERDE}${NEGRITO}${passed}/${pids.length} PIDs lidos com sucesso${RESET}`);

    await client.disconnect();
    console.log(`\n${VERDE}✅ Desconectado com sucesso${RESET}\n`);
    process.exit(0);
  } catch (err: any) {
    console.error(`\n${VERMELHO}❌ Erro fatal: ${err.message}${RESET}`);
    process.exit(1);
  }
}

main();
