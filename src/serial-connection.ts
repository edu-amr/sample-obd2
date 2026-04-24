import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { OBD2Connection } from './connection';
import { ConnectionConfig, ConnectionError, TimeoutError } from './types';

export class SerialConnection extends OBD2Connection {
  private port?: SerialPort;
  private parser?: ReadlineParser;
  private responseQueue: Array<{ resolve: (value: string) => void; reject: (error: Error) => void }> = [];

  constructor(config: ConnectionConfig) {
    super(config);
    
    if (!config.port) {
      throw new Error('Serial port is required for serial connection');
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.port = new SerialPort({
        path: this.config.port as string,
        baudRate: this.config.baudRate || 38400,
        autoOpen: false
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r' }));

      this.port.open((error) => {
        if (error) {
          reject(new ConnectionError(`Failed to open serial port: ${error.message}`));
          return;
        }

        this.isConnected = true;
        this.setupEventHandlers();
        this.emit('connected');
        resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.port && this.port.isOpen) {
        this.port.close(() => {
          this.isConnected = false;
          this.emit('disconnected');
          resolve();
        });
      } else {
        this.isConnected = false;
        resolve();
      }
    });
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.port || !this.parser) {
      throw new ConnectionError('Not connected to serial port');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(`Command timeout: ${command}`));
      }, this.timeout);

      this.responseQueue.push({
        resolve: (response: string) => {
          clearTimeout(timeoutId);
          try {
            this.validateResponse(response);
            resolve(this.cleanResponse(response));
          } catch (error) {
            reject(error);
          }
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      this.port!.write(command + '\r', (error) => {
        if (error) {
          clearTimeout(timeoutId);
          this.responseQueue.pop();
          reject(new ConnectionError(`Failed to send command: ${error.message}`));
        }
      });
    });
  }

  isConnectionOpen(): boolean {
    return this.port ? this.port.isOpen : false;
  }

  private setupEventHandlers(): void {
    if (!this.parser) return;

    this.parser.on('data', (data: string) => {
      const response = data.toString().trim();
      
      if (this.responseQueue.length > 0) {
        const { resolve } = this.responseQueue.shift()!;
        resolve(response);
      }
      
      this.emit('data', response);
    });

    this.parser.on('error', (error) => {
      this.emit('error', new ConnectionError(`Serial port error: ${error.message}`));
      
      // Reject any pending commands
      while (this.responseQueue.length > 0) {
        const { reject } = this.responseQueue.shift()!;
        reject(new ConnectionError('Connection lost'));
      }
    });

    if (this.port) {
      this.port.on('close', () => {
        this.isConnected = false;
        this.emit('disconnected');
        
        // Reject any pending commands
        while (this.responseQueue.length > 0) {
          const { reject } = this.responseQueue.shift()!;
          reject(new ConnectionError('Connection closed'));
        }
      });
    }
  }

  static async listPorts(): Promise<Array<{ path: string; manufacturer: string | undefined; serialNumber: string | undefined }>> {
    const { SerialPort } = await import('serialport');
    const ports = await SerialPort.list();
    return ports.map(port => ({
      path: port.path,
      manufacturer: port.manufacturer ?? undefined,
      serialNumber: port.serialNumber ?? undefined
    }));
  }
}
