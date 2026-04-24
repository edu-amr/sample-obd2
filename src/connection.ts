import { EventEmitter } from 'events';
import { ConnectionConfig, OBD2AdapterInfo, ConnectionError, TimeoutError, ProtocolError } from './types';

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
    const cleanResponse = response.trim().toUpperCase();
    
    if (cleanResponse.includes('UNABLE TO CONNECT')) {
      throw new ConnectionError('Unable to connect to vehicle');
    }
    
    if (cleanResponse.includes('NO DATA')) {
      throw new ProtocolError('No data received from vehicle');
    }
    
    if (cleanResponse.includes('BUS INIT')) {
      throw new ProtocolError('Bus initialization error');
    }
    
    if (cleanResponse.includes('?')) {
      throw new ProtocolError('Unknown command or invalid response');
    }
    
    if (cleanResponse.includes('CAN ERROR')) {
      throw new ProtocolError('CAN bus error');
    }
  }

  protected cleanResponse(response: string): string {
    return response
      .replace(/\r/g, '')
      .replace(/\n/g, '')
      .replace(/\s/g, '')
      .replace(/>/g, '')
      .toUpperCase();
  }

  async initialize(): Promise<OBD2AdapterInfo> {
    if (!this.isConnected) {
      throw new ConnectionError('Not connected to adapter');
    }

    try {
      // Reset adapter
      await this.sendCommand('ATZ');
      await this.delay(1000);

      // Turn off echo
      await this.sendCommand('ATE0');
      
      // Turn off line feeds
      await this.sendCommand('ATL0');
      
      // Turn off spaces
      await this.sendCommand('ATS0');
      
      // Set timeout
      await this.sendCommand('ATST32');
      
      // Adaptive timing auto
      await this.sendCommand('ATAT1');
      
      // Get adapter version
      const version = await this.sendCommand('ATI');
      
      // Get device description
      const device = await this.sendCommand('AT@1');
      
      // Set protocol to automatic
      await this.sendCommand('ATSP0');
      
      // Get protocol
      const protocol = await this.sendCommand('ATDP');
      
      return {
        version: this.cleanResponse(version),
        device: this.cleanResponse(device),
        protocol: this.cleanResponse(protocol)
      };
    } catch (error) {
      throw new ProtocolError(`Failed to initialize adapter: ${error}`);
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConnectionStatus(): boolean {
    return this.isConnected && this.isConnectionOpen();
  }
}
