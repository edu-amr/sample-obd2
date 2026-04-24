import net from 'node:net';
import { OBD2Connection } from './connection';
import { ConnectionConfig, ConnectionError, TimeoutError } from './types';

export class WifiConnection extends OBD2Connection {
  private client: net.Socket | null;
  private host: string;
  private port: number;
  private responseQueue: Array<{ resolve: (value: string | PromiseLike<string>) => void }>;
  private buffer: string;

  constructor(config: ConnectionConfig) {
    super(config);
    this.client = null;
    this.host = config.host || '192.168.0.10';
    this.port = config.port
      ? typeof config.port === 'string'
        ? parseInt(config.port)
        : config.port
      : 35000;
    this.responseQueue = [];
    this.buffer = '';
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new net.Socket();

      this.client.connect(this.port, this.host, () => {
        this.isConnected = true;
        console.log(`[WiFi] Conectado a ${this.host}:${this.port}`);
        this.emit('connected');
        resolve();
      });

      this.client.on('data', (data: Buffer) => {
        this.buffer += data.toString();
        // O ELM327 sinaliza fim de resposta com '>'
        if (this.buffer.includes('>')) {
          const response = this.buffer.replace('>', '').trim();
          this.buffer = ''; // Limpa para a próxima

          if (this.responseQueue.length > 0) {
            const queued = this.responseQueue.shift();
            if (queued) queued.resolve(response);
          }
          this.emit('data', response);
        }
      });

      this.client.on('error', (err: Error) => {
        reject(new ConnectionError(`Erro WiFi: ${err.message}`));
      });
    });
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.isConnected || !this.client) throw new ConnectionError('Não conectado');

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.responseQueue.shift();
        reject(new TimeoutError(`Timeout no comando: ${command}`));
      }, this.timeout);

      this.responseQueue.push({
        resolve: (resp: string | PromiseLike<string>) => {
          clearTimeout(timeoutId);
          try {
            const responseStr = resp.toString();
            this.validateResponse(responseStr);
            resolve(this.cleanResponse(responseStr));
          } catch (error: any) {
            reject(error);
          }
        },
      });

      this.client!.write(`${command}\r`);
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    this.isConnected = false;
    this.emit('disconnected');
  }

  isConnectionOpen(): boolean {
    return this.isConnected;
  }
}
