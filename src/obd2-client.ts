import { EventEmitter } from 'events';
import { OBD2Connection } from './connection';
import { SerialConnection } from './serial-connection';
import { BluetoothConnection } from './bluetooth-connection';
import { WifiConnection } from './wifi-connection';
import { OBD2_COMMANDS, getCommandByPid } from './commands';
import { 
  ConnectionConfig, 
  OBD2Response, 
  OBD2Command, 
  OBD2AdapterInfo,
  ConnectionError,
  ProtocolError 
} from './types';

export class OBD2Client extends EventEmitter {
  private connection: OBD2Connection | undefined;
  private adapterInfo?: OBD2AdapterInfo;
  private isInitialized = false;

  constructor(private config: ConnectionConfig) {
    super();
  }

  async connect(): Promise<void> {
    try {
      // Create appropriate connection type
      if (this.config.type === 'serial') {
        this.connection = new SerialConnection(this.config);
      } else if (this.config.type === 'bluetooth') {
        this.connection = new BluetoothConnection(this.config);
      } else if (this.config.type === 'wifi') {
        this.connection = new WifiConnection(this.config);
      } else {
        throw new Error(`Unsupported connection type: ${this.config.type}`);
      }

      // Setup event forwarding
      this.connection.on('connected', () => this.emit('connected'));
      this.connection.on('disconnected', () => this.emit('disconnected'));
      this.connection.on('error', (error) => this.emit('error', error));
      this.connection.on('data', (data) => this.emit('rawData', data));

      // Connect to adapter
      await this.connection.connect();

      // Initialize adapter
      this.adapterInfo = await this.connection.initialize();
      this.isInitialized = true;

      this.emit('ready', this.adapterInfo);
    } catch (error) {
      throw new ConnectionError(`Failed to connect: ${error}`);
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
      throw new ConnectionError('Not connected to OBD2 adapter');
    }

    const command = OBD2_COMMANDS[commandName];
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    return this.queryCommand(command);
  }

  async queryPid(pid: string): Promise<OBD2Response> {
    if (!this.isConnected()) {
      throw new ConnectionError('Not connected to OBD2 adapter');
    }

    const command = getCommandByPid(pid);
    if (!command) {
      throw new Error(`Unknown PID: ${pid}`);
    }

    return this.queryCommand(command);
  }

  async queryCommand(command: OBD2Command): Promise<OBD2Response> {
    if (!this.connection) {
      throw new ConnectionError('Not connected to OBD2 adapter');
    }

    try {
      const response = await this.connection.sendCommand(command.pid);
      const value = command.decoder(response);

      const result: OBD2Response = {
        command: command.name,
        value,
        unit: command.unit,
        timestamp: new Date()
      };

      this.emit('response', result);
      return result;
    } catch (error) {
      throw new ProtocolError(`Failed to query ${command.name}: ${error}`);
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
        // Continue with other commands even if one fails
      }
    }
    
    return results;
  }

  async getSupportedPids(): Promise<string[]> {
    if (!this.connection) {
      throw new ConnectionError('Not connected to OBD2 adapter');
    }

    try {
      // Query PIDs 00, 20, 40, 60, 80, A0, C0, E0 to get all supported PIDs
      const supportedPids: string[] = [];
      const pidQueries = ['0100', '0120', '0140', '0160', '0180', '01A0', '01C0', '01E0'];

      for (const pidQuery of pidQueries) {
        try {
          const response = await this.connection.sendCommand(pidQuery);
          const supportedInRange = this.parseSupportedPids(response, pidQuery);
          supportedPids.push(...supportedInRange);
        } catch (error) {
          // Some ranges might not be supported, continue with others
          continue;
        }
      }

      return supportedPids;
    } catch (error) {
      throw new ProtocolError(`Failed to get supported PIDs: ${error}`);
    }
  }

  async getVehicleInfo(): Promise<Record<string, any>> {
    const info: Record<string, any> = {};

    try {
      // Get VIN
      const vin = await this.query('VIN');
      info.vin = vin.value;
    } catch (error) {
      // VIN might not be supported
    }

    try {
      // Get OBD standards
      const standards = await this.query('OBD_STANDARDS');
      info.obdStandards = standards.value;
    } catch (error) {
      // Standards might not be supported
    }

    // Add adapter info
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
    
    // Extract the data part (skip mode and PID bytes)
    const dataStart = 4; // Skip "41XX" where XX is the PID
    const data = cleanResponse.substring(dataStart);
    
    if (data.length >= 8) {
      // Convert hex string to binary and check each bit
      const hex: string = data.substring(0, 8);
      let binary = '';
      
      for (let i = 0; i < hex.length; i++) {
        const digit = parseInt(hex[i]!, 16);
        binary += digit.toString(2).padStart(4, '0');
      }
      
      // Get base PID number
      const basePid = parseInt(baseQuery.substring(2), 16);
      
      // Check each bit
      for (let i = 0; i < binary.length; i++) {
        if (binary[i] === '1') {
          const pidNumber = basePid + i + 1;
          supportedPids.push(pidNumber.toString(16).toUpperCase().padStart(2, '0'));
        }
      }
    }
    
    return supportedPids;
  }

  // Convenience methods for common queries
  async getRPM(): Promise<number> {
    const response = await this.query('ENGINE_RPM');
    return response.value as number;
  }

  async getSpeed(): Promise<number> {
    const response = await this.query('VEHICLE_SPEED');
    return response.value as number;
  }

  async getCoolantTemperature(): Promise<number> {
    const response = await this.query('COOLANT_TEMP');
    return response.value as number;
  }

  async getEngineLoad(): Promise<number> {
    const response = await this.query('ENGINE_LOAD');
    return response.value as number;
  }

  async getFuelLevel(): Promise<number> {
    const response = await this.query('FUEL_LEVEL');
    return response.value as number;
  }

  async getThrottlePosition(): Promise<number> {
    const response = await this.query('THROTTLE_POS');
    return response.value as number;
  }
}
