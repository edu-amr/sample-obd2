import { EventEmitter } from 'events';
import { ConnectionConfig, ConnectionError, OBD2AdapterInfo, ProtocolError } from './types';

export abstract class OBD2Connection extends EventEmitter {
  protected isConnected = false;
  protected timeout: number;

  constructor(protected config: ConnectionConfig) {
    super();
    this.timeout = config.timeout || 5000;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendCommand(command: string): Promise<string>;
  abstract isConnectionOpen(): boolean;

  protected validateResponse(response: string): void {
    const clean = response.trim().toUpperCase();

    if (clean.includes('UNABLE TO CONNECT')) {
      throw new ConnectionError('Unable to connect to vehicle');
    }
    if (clean.includes('NO DATA')) {
      throw new ProtocolError('No data received from vehicle');
    }
    if (clean.includes('BUS INIT')) {
      throw new ProtocolError('Bus initialization error');
    }
    // '?' sozinho = comando inválido; mas ignora se vier junto com dados reais
    if (clean === '?') {
      throw new ProtocolError('Unknown command or invalid response');
    }
    if (clean.includes('CAN ERROR')) {
      throw new ProtocolError('CAN bus error');
    }
    if (clean.includes('STOPPED')) {
      throw new ProtocolError('Communication stopped');
    }
    if (clean.includes('BUFFER FULL')) {
      throw new ProtocolError('ELM327 buffer full');
    }
    if (clean.includes('ERROR')) {
      throw new ProtocolError(`ELM327 error: ${clean}`);
    }
  }

  protected cleanResponse(response: string): string {
    return response
      .replace(/SEARCHING\.\.\./gi, '')
      .replace(/BUS INIT\.\.\./gi, '')
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/>/g, '')
      .trim()
      .toUpperCase()
      .split(' ')
      .filter((part) => part.length > 0)
      .join('');
  }

  async initialize(): Promise<OBD2AdapterInfo> {
    if (!this.isConnected) {
      throw new ConnectionError('Not connected to adapter');
    }

    try {
      // Reset — clones baratos podem demorar mais que 1s
      // FIX: aumentado para 1500ms para garantir estabilidade
      await this.sendCommand('ATZ');
      await this.delay(1500);

      // Desliga echo — essencial para o parser funcionar corretamente
      await this.sendCommand('ATE0');

      // Desliga line feeds
      await this.sendCommand('ATL0');

      // Desliga espaços nas respostas
      await this.sendCommand('ATS0');

      // Timeout do adaptador (~200ms por unidade de 4ms)
      await this.sendCommand('ATST32');

      // Adaptive timing automático
      await this.sendCommand('ATAT1');

      // Versão do firmware (ex: "ELM327 v1.5")
      const version = await this.sendCommand('ATI');

      // FIX: AT@1 NÃO É SUPORTADO pela maioria dos clones ELM327 baratos.
      // Se enviado, retorna '?' e derruba o initialize inteiro.
      // Colocado em try/catch com fallback seguro.
      let device = 'Unknown';
      try {
        const rawDevice = await this.sendCommand('AT@1');
        device = this.cleanResponse(rawDevice);
      } catch (_) {
        // Clone não suporta AT@1 — ignora silenciosamente
      }

      // Auto-detect do protocolo CAN/ISO/etc
      await this.sendCommand('ATSP0');

      // Lê o protocolo detectado (ex: "AUTO, ISO 15765-4 (CAN 11/500)")
      const protocol = await this.sendCommand('ATDP');

      return {
        version: this.cleanResponse(version),
        device,
        protocol: this.cleanResponse(protocol),
      };
    } catch (error) {
      throw new ProtocolError(`Failed to initialize adapter: ${error}`);
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getConnectionStatus(): boolean {
    return this.isConnected && this.isConnectionOpen();
  }
}
