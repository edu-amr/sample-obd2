// Core interfaces and types
export interface OBD2Command {
  name: string;
  pid: string;
  description: string;
  decoder: (data: string) => number | string | boolean;
  unit?: string;
}

export interface OBD2Response {
  command: string;
  value: number | string | boolean;
  unit: string | undefined;
  timestamp: Date;
}

export interface ConnectionConfig {
  type: 'bluetooth' | 'serial' | 'wifi';
  address?: string; // For Bluetooth
  port?: string | number;    // For Serial and WiFi
  host?: string;    // For WiFi
  baudRate?: number;
  timeout?: number;
}

export interface OBD2AdapterInfo {
  protocol: string;
  version: string;
  device: string;
}

export enum OBD2Protocol {
  AUTO = '0',
  SAE_J1850_PWM = '1',
  SAE_J1850_VPW = '2',
  ISO_9141_2 = '3',
  ISO_14230_4_KWP = '4',
  ISO_14230_4_KWP_FAST = '5',
  ISO_15765_4_CAN = '6',
  ISO_15765_4_CAN_B = '7',
  ISO_15765_4_CAN_C = '8',
  ISO_15765_4_CAN_D = '9',
  SAE_J1939_CAN = 'A',
  USER1_CAN = 'B',
  USER2_CAN = 'C'
}

export class OBD2Error extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'OBD2Error';
  }
}

export class ConnectionError extends OBD2Error {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR');
  }
}

export class TimeoutError extends OBD2Error {
  constructor(message: string) {
    super(message, 'TIMEOUT_ERROR');
  }
}

export class ProtocolError extends OBD2Error {
  constructor(message: string) {
    super(message, 'PROTOCOL_ERROR');
  }
}
