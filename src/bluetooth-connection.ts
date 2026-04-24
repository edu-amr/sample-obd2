import { OBD2Connection } from './connection';
import { ConnectionConfig, ConnectionError, TimeoutError } from './types';

export class BluetoothConnection extends OBD2Connection {
  private socket?: any; // Will be WebSocket or native Bluetooth socket
  private responseQueue: Array<{ resolve: (value: string) => void; reject: (error: Error) => void }> = [];
  private buffer = '';

  constructor(config: ConnectionConfig) {
    super(config);
    
    if (!config.address) {
      throw new Error('Bluetooth address is required for Bluetooth connection');
    }
  }

  async connect(): Promise<void> {
    try {
      // For web browsers, we would use Web Bluetooth API
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        await this.connectWebBluetooth();
      } else {
        // For Node.js, we would use a native Bluetooth library
        await this.connectNativeBluetooth();
      }
      
      this.isConnected = true;
      this.emit('connected');
    } catch (error) {
      throw new ConnectionError(`Failed to connect via Bluetooth: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        if (typeof this.socket.close === 'function') {
          this.socket.close();
        } else if (typeof this.socket.disconnect === 'function') {
          this.socket.disconnect();
        }
      } catch (error) {
        // Ignore disconnect errors
      }
      this.socket = undefined;
    }
    
    this.isConnected = false;
    this.emit('disconnected');
    
    // Reject any pending commands
    while (this.responseQueue.length > 0) {
      const { reject } = this.responseQueue.shift()!;
      reject(new ConnectionError('Connection closed'));
    }
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.socket) {
      throw new ConnectionError('Not connected via Bluetooth');
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

      const commandWithCR = command + '\r';
      
      try {
        if (this.socket.send) {
          this.socket.send(commandWithCR);
        } else if (this.socket.write) {
          this.socket.write(commandWithCR);
        } else {
          throw new Error('Socket does not support sending data');
        }
      } catch (error) {
        clearTimeout(timeoutId);
        this.responseQueue.pop();
        reject(new ConnectionError(`Failed to send command: ${error}`));
      }
    });
  }

  isConnectionOpen(): boolean {
    return this.socket !== undefined && this.isConnected;
  }

  private async connectWebBluetooth(): Promise<void> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth API not available');
    }

    try {
      // Request Bluetooth device
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }], // OBD2 service UUID
        optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb']
      });

      // Connect to GATT Server
      const server = await device.gatt.connect();
      
      // Get the service
      const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      
      // Get characteristics
      const characteristic = await service.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb');
      
      // Setup notifications
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', this.handleBluetoothData.bind(this));
      
      this.socket = {
        send: (data: string) => {
          const encoder = new TextEncoder();
          return characteristic.writeValue(encoder.encode(data));
        },
        close: () => {
          device.gatt.disconnect();
        }
      };
    } catch (error) {
      throw new ConnectionError(`Web Bluetooth connection failed: ${error}`);
    }
  }

  private async connectNativeBluetooth(): Promise<void> {
    // This would require a native Bluetooth library for Node.js
    // For now, we'll throw an error indicating it's not implemented
    throw new Error('Native Bluetooth connection not implemented. Please use serial connection or web environment.');
  }

  private handleBluetoothData(event: any): void {
    const decoder = new TextDecoder();
    const data = decoder.decode(event.target.value);
    
    this.buffer += data;
    
    // Process complete lines
    while (this.buffer.includes('\r')) {
      const lineEnd = this.buffer.indexOf('\r');
      const line = this.buffer.substring(0, lineEnd);
      this.buffer = this.buffer.substring(lineEnd + 1);
      
      if (line.trim()) {
        this.processResponse(line.trim());
      }
    }
  }

  private processResponse(response: string): void {
    if (this.responseQueue.length > 0) {
      const { resolve } = this.responseQueue.shift()!;
      resolve(response);
    }
    
    this.emit('data', response);
  }

  static async isBluetoothAvailable(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      return await (navigator as any).bluetooth.getAvailability();
    }
    return false;
  }
}
