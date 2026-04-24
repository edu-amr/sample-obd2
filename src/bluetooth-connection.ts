import { OBD2Connection } from './connection';
import { ConnectionConfig, ConnectionError, TimeoutError } from './types';

interface QueueEntry {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

/**
 * BluetoothConnection — suporte limitado:
 * - Browser: usa Web Bluetooth API (BLE apenas)
 * - Node.js/Mac: NÃO implementado nativamente.
 *   Para Bluetooth no Mac/Linux via Node, use SerialConnection
 *   com o dispositivo pareado via rfcomm (/dev/tty.*)
 */
export class BluetoothConnection extends OBD2Connection {
  private socket?: any;
  private responseQueue: QueueEntry[] = [];
  private buffer = '';

  constructor(config: ConnectionConfig) {
    super(config);
    if (!config.address) {
      throw new Error('Endereço Bluetooth é obrigatório para conexão Bluetooth');
    }
  }

  async connect(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        await this.connectWebBluetooth();
      } else {
        await this.connectNativeBluetooth();
      }
      this.isConnected = true;
      this.emit('connected');
    } catch (error) {
      throw new ConnectionError(`Falha na conexão Bluetooth: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this._flushQueueWithError(new ConnectionError('Desconectado'));
    if (this.socket) {
      try {
        if (typeof this.socket.close === 'function') this.socket.close();
        else if (typeof this.socket.disconnect === 'function') this.socket.disconnect();
      } catch (_) {}
      this.socket = undefined;
    }
    this.isConnected = false;
    this.emit('disconnected');
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.socket) {
      throw new ConnectionError('Não conectado via Bluetooth');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(`Timeout no comando: ${command}`));
      }, this.timeout);

      this.responseQueue.push({
        resolve: (response: string) => {
          clearTimeout(timeoutId);
          try {
            this.validateResponse(response);
            resolve(this.cleanResponse(response));
          } catch (error: any) {
            reject(error);
          }
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });

      const cmd = command + '\r';
      try {
        if (this.socket.send) this.socket.send(cmd);
        else if (this.socket.write) this.socket.write(cmd);
        else throw new Error('Socket não suporta envio de dados');
      } catch (error) {
        clearTimeout(timeoutId);
        this.responseQueue.pop();
        reject(new ConnectionError(`Falha ao enviar comando: ${error}`));
      }
    });
  }

  isConnectionOpen(): boolean {
    return this.socket !== undefined && this.isConnected;
  }

  private async connectWebBluetooth(): Promise<void> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth API não disponível');
    }

    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }],
      optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb'],
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb');

    await characteristic.startNotifications();
    characteristic.addEventListener(
      'characteristicvaluechanged',
      this.handleBluetoothData.bind(this),
    );

    this.socket = {
      send: (data: string) => {
        const encoder = new TextEncoder();
        return characteristic.writeValue(encoder.encode(data));
      },
      close: () => device.gatt.disconnect(),
    };
  }

  private async connectNativeBluetooth(): Promise<void> {
    // No Mac/Linux via Node.js, Bluetooth clássico (SPP) requer
    // parear o dispositivo via sistema operacional e usar SerialConnection.
    // Ex Mac: /dev/tty.OBDII-Port ou similar
    // Ex Linux: rfcomm connect /dev/rfcomm0 <MAC> && usar SerialConnection
    throw new Error(
      'Bluetooth nativo não suportado em Node.js neste adaptador. ' +
        'Use SerialConnection com o dispositivo pareado via rfcomm (Linux) ' +
        'ou /dev/tty.* (Mac).',
    );
  }

  private handleBluetoothData(event: any): void {
    const decoder = new TextDecoder();
    const data = decoder.decode(event.target.value);
    this.buffer += data;

    let idx: number;
    while ((idx = this.buffer.indexOf('>')) !== -1) {
      const raw = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      if (raw.length > 0 && this.responseQueue.length > 0) {
        this.responseQueue.shift()!.resolve(raw);
      }
      if (raw.length > 0) this.emit('data', raw);
    }
  }

  private _flushQueueWithError(err: Error): void {
    while (this.responseQueue.length > 0) {
      this.responseQueue.shift()!.reject(err);
    }
  }

  static async isBluetoothAvailable(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      return await (navigator as any).bluetooth.getAvailability();
    }
    return false;
  }
}
