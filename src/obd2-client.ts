import { EventEmitter } from 'events';
import { BluetoothConnection } from './bluetooth-connection';
import { OBD2_COMMANDS, getCommandByPid } from './commands';
import { OBD2Connection } from './connection';
import { SerialConnection } from './serial-connection';
import {
  ConnectionConfig,
  ConnectionError,
  OBD2AdapterInfo,
  OBD2Command,
  OBD2Response,
  ProtocolError,
} from './types';
import { WifiConnection } from './wifi-connection';

export class OBD2Client extends EventEmitter {
  private connection: OBD2Connection | undefined;
  private adapterInfo?: OBD2AdapterInfo;
  private isInitialized = false;

  constructor(private config: ConnectionConfig) {
    super();
  }

  async connect(): Promise<void> {
    try {
      if (this.config.type === 'serial') {
        this.connection = new SerialConnection(this.config);
      } else if (this.config.type === 'bluetooth') {
        this.connection = new BluetoothConnection(this.config);
      } else if (this.config.type === 'wifi') {
        this.connection = new WifiConnection(this.config);
      } else {
        throw new Error(`Tipo de conexão não suportado: ${this.config.type}`);
      }

      this.connection.on('connected', () => this.emit('connected'));
      this.connection.on('disconnected', () => this.emit('disconnected'));
      this.connection.on('error', (error) => this.emit('error', error));
      this.connection.on('data', (data) => this.emit('rawData', data));

      await this.connection.connect();

      this.adapterInfo = await this.connection.initialize();
      this.isInitialized = true;

      this.emit('ready', this.adapterInfo);
    } catch (error) {
      throw new ConnectionError(`Falha ao conectar: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.disconnect();
      this.connection = undefined;
      this.isInitialized = false;
    }
  }

  async query(commandName: string): Promise<OBD2Response> {
    if (!this.isConnected()) {
      throw new ConnectionError('Não conectado ao adaptador OBD2');
    }

    const command = OBD2_COMMANDS[commandName];
    if (!command) {
      throw new Error(`Comando desconhecido: ${commandName}`);
    }

    return this.queryCommand(command);
  }

  async queryPid(pid: string): Promise<OBD2Response> {
    if (!this.isConnected()) {
      throw new ConnectionError('Não conectado ao adaptador OBD2');
    }

    const command = getCommandByPid(pid);
    if (!command) {
      throw new Error(`PID desconhecido: ${pid}`);
    }

    return this.queryCommand(command);
  }

  async queryCommand(command: OBD2Command): Promise<OBD2Response> {
    if (!this.connection) {
      throw new ConnectionError('Não conectado ao adaptador OBD2');
    }

    try {
      const response = await this.connection.sendCommand(command.pid);
      const value = command.decoder(response);

      const result: OBD2Response = {
        command: command.name,
        value,
        unit: command.unit,
        timestamp: new Date(),
      };

      this.emit('response', result);
      return result;
    } catch (error) {
      throw new ProtocolError(`Falha ao consultar ${command.name}: ${error}`);
    }
  }

  async queryMultiple(commandNames: string[]): Promise<OBD2Response[]> {
    const results: OBD2Response[] = [];
    for (const commandName of commandNames) {
      try {
        const result = await this.query(commandName);
        results.push(result);
      } catch (error) {
        this.emit('error', error);
      }
    }
    return results;
  }

  async getSupportedPids(): Promise<string[]> {
    if (!this.connection) {
      throw new ConnectionError('Não conectado ao adaptador OBD2');
    }

    const supportedPids: string[] = [];
    const pidQueries = ['0100', '0120', '0140', '0160', '0180', '01A0', '01C0', '01E0'];

    for (const pidQuery of pidQueries) {
      try {
        const response = await this.connection.sendCommand(pidQuery);
        const inRange = this.parseSupportedPids(response, pidQuery);
        supportedPids.push(...inRange);
      } catch (_) {
        continue;
      }
    }

    return supportedPids;
  }

  async getVehicleInfo(): Promise<Record<string, any>> {
    const info: Record<string, any> = {};

    try {
      const vin = await this.query('VIN');
      info.vin = vin.value;
    } catch (_) {
      info.vin = 'Não disponível';
    }

    try {
      const standards = await this.query('OBD_STANDARDS');
      info.obdStandards = standards.value;
    } catch (_) {}

    if (this.adapterInfo) {
      info.adapter = this.adapterInfo;
    }

    return info;
  }

  isConnected(): boolean {
    return this.connection?.getConnectionStatus() || false;
  }

  getAdapterInfo(): OBD2AdapterInfo | undefined {
    return this.adapterInfo;
  }

  getAvailableCommands(): string[] {
    return Object.keys(OBD2_COMMANDS);
  }

  private parseSupportedPids(response: string, baseQuery: string): string[] {
    const supportedPids: string[] = [];
    const cleanResponse = response.replace(/\s/g, '');
    const dataStart = 4;
    const data = cleanResponse.substring(dataStart);

    if (data.length >= 8) {
      const hex = data.substring(0, 8);
      let binary = '';
      for (let i = 0; i < hex.length; i++) {
        const digit = parseInt(hex[i]!, 16);
        binary += digit.toString(2).padStart(4, '0');
      }
      const basePid = parseInt(baseQuery.substring(2), 16);
      for (let i = 0; i < binary.length; i++) {
        if (binary[i] === '1') {
          const pidNumber = basePid + i + 1;
          supportedPids.push(pidNumber.toString(16).toUpperCase().padStart(2, '0'));
        }
      }
    }

    return supportedPids;
  }

  // Métodos de conveniência
  async getRPM(): Promise<number> {
    return (await this.query('ENGINE_RPM')).value as number;
  }

  async getSpeed(): Promise<number> {
    return (await this.query('VEHICLE_SPEED')).value as number;
  }

  async getCoolantTemperature(): Promise<number> {
    return (await this.query('COOLANT_TEMP')).value as number;
  }

  async getEngineLoad(): Promise<number> {
    return (await this.query('ENGINE_LOAD')).value as number;
  }

  async getFuelLevel(): Promise<number> {
    return (await this.query('FUEL_LEVEL')).value as number;
  }

  async getThrottlePosition(): Promise<number> {
    return (await this.query('THROTTLE_POS')).value as number;
  }
}
