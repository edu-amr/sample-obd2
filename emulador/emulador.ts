/**
 * Emulador ELM327 WiFi
 * Simula um adaptador ELM327 real via TCP na porta 35000
 * Use para testar seu código antes do hardware chegar
 *
 * Rodar: npx ts-node emulator/elm327-emulator.ts
 */

import net from 'node:net';

// ─── Dados simulados do veículo (variam com o tempo) ────────────────────────
const vehicle = {
  rpm: 850,
  speed: 0,
  coolantTemp: 82,
  engineLoad: 25.0,
  throttle: 8.0,
  fuelLevel: 68.0,
  intakeTemp: 35,
  maf: 3.5,
  timingAdvance: 8.0,
  intakePressure: 35,
  runtime: 0,
};

// Simula variações realistas ao longo do tempo
function tickVehicle() {
  vehicle.runtime += 1;
  vehicle.rpm = 800 + Math.sin(Date.now() / 3000) * 200 + Math.random() * 50;
  vehicle.speed = Math.max(0, vehicle.speed + (Math.random() - 0.48) * 3);
  vehicle.coolantTemp = Math.min(95, vehicle.coolantTemp + (Math.random() - 0.3) * 0.2);
  vehicle.engineLoad = 20 + Math.abs(Math.sin(Date.now() / 5000)) * 30 + Math.random() * 5;
  vehicle.throttle = 5 + Math.abs(Math.sin(Date.now() / 4000)) * 20;
  vehicle.maf = 2 + vehicle.engineLoad / 20 + Math.random() * 0.5;
  vehicle.intakePressure = 30 + vehicle.engineLoad * 0.5;
  vehicle.timingAdvance = 8 + Math.random() * 4;
}

setInterval(tickVehicle, 500);

// ─── Encoders OBD2 (valor → HEX de resposta) ────────────────────────────────
function toHex(n: number, bytes: number): string {
  const val = Math.max(0, Math.round(n));
  return val.toString(16).toUpperCase().padStart(bytes * 2, '0');
}

function encodeRPM(rpm: number): string {
  const val = Math.round(rpm * 4);
  const a = Math.floor(val / 256);
  const b = val % 256;
  return `410C${toHex(a, 1)}${toHex(b, 1)}`;
}

function encodeTemp(temp: number, pid: string): string {
  // Formato correto: 41 + pid (2 chars) + byte valor
  // Ex: coolant 82°C → 4105 + 7A = "41057A"
  return `41${pid}${toHex(Math.round(temp) + 40, 1)}`;
}

function encodePercent(val: number, pid: string): string {
  // Ex: throttle 20% → 4111 + 33 = "411133"
  return `41${pid}${toHex((val / 100) * 255, 1)}`;
}

function encodeMAF(maf: number): string {
  const val = Math.round(maf * 100);
  const a = Math.floor(val / 256);
  const b = val % 256;
  return `4110${toHex(a, 1)}${toHex(b, 1)}`;
}

function encodeRuntime(seconds: number): string {
  const a = Math.floor(seconds / 256);
  const b = seconds % 256;
  return `411F${toHex(a, 1)}${toHex(b, 1)}`;
}

// ─── Mapa de respostas AT e PID ──────────────────────────────────────────────
function getResponse(cmd: string): string {
  const c = cmd.trim().toUpperCase().replace(/\r/g, '');

  // Comandos AT de inicialização
  if (c === 'ATZ')   return 'ELM327 v1.5';
  if (c === 'ATE0')  return 'OK';
  if (c === 'ATL0')  return 'OK';
  if (c === 'ATS0')  return 'OK';
  if (c === 'ATST32') return 'OK';
  if (c === 'ATAT1') return 'OK';
  if (c === 'ATSP0') return 'OK';
  if (c === 'ATI')   return 'ELM327 v1.5';
  if (c === 'AT@1')  return 'OBDII to RS232 Interpreter';
  if (c === 'ATDP')  return 'AUTO, ISO 15765-4 (CAN 11/500)';

  // PIDs suportados (0100)
  if (c === '0100') return '4100BE3FA813';

  // Modo 01 — dados em tempo real
  if (c === '010C') return encodeRPM(vehicle.rpm);
  if (c === '010D') return `410D${toHex(vehicle.speed, 1)}`;
  if (c === '0105') return encodeTemp(vehicle.coolantTemp, '05');
  if (c === '010F') return encodeTemp(vehicle.intakeTemp, '0F');
  if (c === '0104') return encodePercent(vehicle.engineLoad, '04');
  if (c === '0111') return encodePercent(vehicle.throttle, '11');
  if (c === '012F') return encodePercent(vehicle.fuelLevel, '2F');
  if (c === '0110') return encodeMAF(vehicle.maf);
  if (c === '010B') return `410B${toHex(vehicle.intakePressure, 1)}`;
  if (c === '010E') return `410E${toHex(vehicle.timingAdvance / 2 + 64, 1)}`;
  if (c === '011F') return encodeRuntime(vehicle.runtime);
  if (c === '011C') return '411C06'; // EOBD (Europa)

  // DTCs — sem falhas
  if (c === '03') return '43 00 00 00 00 00 00';

  // Modo 09 — VIN (simplificado, single frame)
  if (c === '0902') {
    const vin = '1HGBH41JXMN109186';
    const hex = vin.split('').map(ch => ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).join('');
    return `490201${hex}`;
  }

  // Comando desconhecido
  return '?';
}

// ─── Servidor TCP ────────────────────────────────────────────────────────────
const PORT = 35000;
const HOST = '127.0.0.1';

const server = net.createServer((socket) => {
  const addr = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[ELM327 EMU] Cliente conectado: ${addr}`);

  let buffer = '';

  socket.on('data', (data) => {
    buffer += data.toString();

    // Processa comandos terminados com \r
    let idx: number;
    while ((idx = buffer.indexOf('\r')) !== -1) {
      const cmd = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);

      if (cmd.length === 0) continue;

      console.log(`[ELM327 EMU] ← ${cmd}`);

      // Simula latência real do adaptador (5–30ms)
      const delay = 5 + Math.random() * 25;
      setTimeout(() => {
        const response = getResponse(cmd);
        console.log(`[ELM327 EMU] → ${response}`);
        // Formato ELM327: resposta + \r\n + prompt >
        socket.write(`${response}\r\n>`);
      }, delay);
    }
  });

  socket.on('close', () => {
    console.log(`[ELM327 EMU] Cliente desconectado: ${addr}`);
  });

  socket.on('error', (err) => {
    console.error(`[ELM327 EMU] Erro no socket: ${err.message}`);
  });

  // Envia prompt inicial (como o ELM327 real faz ao conectar)
  setTimeout(() => socket.write('>'), 100);
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║      ELM327 WiFi Emulator v1.0         ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  TCP: ${HOST}:${PORT}                   ║`);
  console.log('║  Protocolo: ISO 15765-4 CAN 11/500     ║');
  console.log('║  Dados: variam a cada 500ms             ║');
  console.log('╠════════════════════════════════════════╣');
  console.log('║  No seu código, use:                   ║');
  console.log(`║    host: '${HOST}'              ║`);
  console.log(`║    port: ${PORT}                        ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('Aguardando conexão...\n');
});

server.on('error', (err) => {
  console.error('[ELM327 EMU] Erro no servidor:', err.message);
});

process.on('SIGINT', () => {
  console.log('\n[ELM327 EMU] Encerrando...');
  server.close(() => process.exit(0));
});