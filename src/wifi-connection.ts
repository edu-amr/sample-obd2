import net from 'node:net';
import { OBD2Connection } from './connection';
import { ConnectionConfig, ConnectionError, TimeoutError } from './types';

interface QueueEntry {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

export class WifiConnection extends OBD2Connection {
  private client: net.Socket | null = null;
  private host: string;
  private port: number;
  // FIX: fila agora tem reject além de resolve
  private responseQueue: QueueEntry[] = [];
  private buffer = '';

  constructor(config: ConnectionConfig) {
    super(config);
    this.host = config.host || '192.168.0.10';
    this.port = config.port
      ? typeof config.port === 'string'
        ? parseInt(config.port, 10)
        : config.port
      : 35000;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new net.Socket();
      this.client.setTimeout(this.timeout);

      this.client.connect(this.port, this.host, () => {
        this.isConnected = true;
        console.log(`[WiFi] Conectado a ${this.host}:${this.port}`);
        this.emit('connected');
        resolve();
      });

      // FIX: buffer processado com while loop para lidar com múltiplos '>'
      // no mesmo chunk TCP (comum na fase de inicialização AT).
      // O replace() anterior removia TODOS os '>' e perdia respostas.
      this.client.on('data', (data: Buffer) => {
        this.buffer += data.toString();

        let idx: number;
        while ((idx = this.buffer.indexOf('>')) !== -1) {
          const raw = this.buffer.slice(0, idx).trim();
          this.buffer = this.buffer.slice(idx + 1);

          if (raw.length > 0 && this.responseQueue.length > 0) {
            const entry = this.responseQueue.shift()!;
            entry.resolve(raw);
          }

          if (raw.length > 0) {
            this.emit('data', raw);
          }
        }
      });

      // FIX: erros de socket agora rejeitam todos os comandos pendentes na fila
      this.client.on('error', (err: Error) => {
        this._flushQueueWithError(new ConnectionError(`Erro WiFi: ${err.message}`));
        this.emit('error', err);
        reject(new ConnectionError(`Falha ao conectar: ${err.message}`));
      });

      this.client.on('timeout', () => {
        const err = new ConnectionError('Connection timeout');
        this._flushQueueWithError(err);
        this.client?.destroy();
        this.emit('error', err);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this._flushQueueWithError(new ConnectionError('Conexão encerrada'));
        this.emit('disconnected');
      });
    });
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.isConnected || !this.client) {
      throw new ConnectionError('Não conectado ao adaptador WiFi');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Remove esta entrada da fila ao dar timeout
        const idx = this.responseQueue.findIndex((e) => e.reject === reject);
        if (idx !== -1) this.responseQueue.splice(idx, 1);
        reject(new TimeoutError(`Timeout no comando: ${command}`));
      }, this.timeout);

      // FIX: fila agora inclui reject para ser chamado em caso de erro de socket
      this.responseQueue.push({
        resolve: (resp: string) => {
          clearTimeout(timeoutId);
          try {
            this.validateResponse(resp);
            resolve(this.cleanResponse(resp));
          } catch (error: any) {
            reject(error);
          }
        },
        reject: (err: Error) => {
          clearTimeout(timeoutId);
          reject(err);
        },
      });

      this.client!.write(`${command}\r`);
    });
  }

  async disconnect(): Promise<void> {
    this._flushQueueWithError(new ConnectionError('Desconectado manualmente'));
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    this.isConnected = false;
    this.emit('disconnected');
  }

  isConnectionOpen(): boolean {
    return this.isConnected && this.client !== null && !this.client.destroyed;
  }

  // Rejeita todos os comandos pendentes com um erro — chamado em close/error/timeout
  private _flushQueueWithError(err: Error): void {
    while (this.responseQueue.length > 0) {
      this.responseQueue.shift()!.reject(err);
    }
  }
}
