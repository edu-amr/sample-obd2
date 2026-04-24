import { OBD2Command } from './types';

// Helper to convert hex to decimal
const hexToDec = (hex: string) => parseInt(hex, 16);

/**
 * Extracts data bytes from an OBD2 response, removing mode and PID
 */
function extractDataBytes(response: string, commandPid: string): string[] {
  const mode = commandPid.substring(0, 2);
  const expectedResponsePrefix =
    (parseInt(mode, 16) + 0x40).toString(16).toUpperCase() + commandPid.substring(2);

  let data = response;
  if (response.startsWith(expectedResponsePrefix)) {
    data = response.substring(expectedResponsePrefix.length);
  } else if (response.length > 4) {
    // Fallback: skip first 4 chars (Mode + PID)
    data = response.substring(4);
  }

  // Split into 2-character hex bytes
  const bytes: string[] = [];
  for (let i = 0; i < data.length; i += 2) {
    const byte = data.substring(i, i + 2);
    if (byte.length === 2) {
      bytes.push(byte);
    }
  }
  return bytes;
}

// Standard OBD2 PIDs (Parameter IDs) with decoders
export const OBD2_COMMANDS: Record<string, OBD2Command> = {
  // Mode 01 - Current Data
  PIDS_00: {
    name: 'PIDS_00',
    pid: '0100',
    description: 'PIDs supported 00-20',
    decoder: (data: string) => (data.length >= 4 ? data.substring(4) : data),
    unit: 'BIT',
  },

  DTC_STATUS: {
    name: 'DTC_STATUS',
    pid: '0101',
    description: 'Monitor status since DTCs cleared',
    decoder: (data: string) => (data.length >= 4 ? data.substring(4) : data),
    unit: 'BIT',
  },

  ENGINE_LOAD: {
    name: 'ENGINE_LOAD',
    pid: '0104',
    description: 'Calculated engine load',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '0104');
      return bytes.length >= 1 ? (hexToDec(bytes[0]!) * 100) / 255 : 0;
    },
    unit: '%',
  },

  COOLANT_TEMP: {
    name: 'COOLANT_TEMP',
    pid: '0105',
    description: 'Engine coolant temperature',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '0105');
      return bytes.length >= 1 ? hexToDec(bytes[0]!) - 40 : 0;
    },
    unit: '°C',
  },

  ENGINE_RPM: {
    name: 'ENGINE_RPM',
    pid: '010C',
    description: 'Engine RPM',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '010C');
      if (bytes.length >= 2) {
        return (hexToDec(bytes[0]!) * 256 + hexToDec(bytes[1]!)) / 4;
      }
      return 0;
    },
    unit: 'rpm',
  },

  VEHICLE_SPEED: {
    name: 'VEHICLE_SPEED',
    pid: '010D',
    description: 'Vehicle Speed Sensor',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '010D');
      return bytes.length >= 1 ? hexToDec(bytes[0]!) : 0;
    },
    unit: 'km/h',
  },

  INTAKE_TEMP: {
    name: 'INTAKE_TEMP',
    pid: '010F',
    description: 'Intake Air Temperature',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '010F');
      return bytes.length >= 1 ? hexToDec(bytes[0]!) - 40 : 0;
    },
    unit: '°C',
  },

  MAF_RATE: {
    name: 'MAF_RATE',
    pid: '0110',
    description: 'Air Flow Rate from Mass Air Flow Sensor',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '0110');
      if (bytes.length >= 2) {
        return (hexToDec(bytes[0]!) * 256 + hexToDec(bytes[1]!)) / 100;
      }
      return 0;
    },
    unit: 'g/s',
  },

  THROTTLE_POS: {
    name: 'THROTTLE_POS',
    pid: '0111',
    description: 'Absolute Throttle Position',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '0111');
      return bytes.length >= 1 ? (hexToDec(bytes[0]!) * 100) / 255 : 0;
    },
    unit: '%',
  },

  FUEL_LEVEL: {
    name: 'FUEL_LEVEL',
    pid: '012F',
    description: 'Fuel Level Input',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '012F');
      return bytes.length >= 1 ? (hexToDec(bytes[0]!) * 100) / 255 : 0;
    },
    unit: '%',
  },

  OBD_STANDARDS: {
    name: 'OBD_STANDARDS',
    pid: '011C',
    description: 'OBD requirements to which vehicle is designed',
    decoder: (data: string) => {
      const standards: Record<number, string> = {
        1: 'OBD-II as defined by CARB',
        2: 'OBD as defined by EPA',
        3: 'OBD and OBD-II',
        4: 'OBD-I',
        5: 'Not OBD compliant',
        6: 'EOBD (Europe)',
        7: 'EOBD and OBD-II',
        8: 'EOBD and OBD',
        9: 'EOBD, OBD and OBD II',
        10: 'JOBD (Japan)',
        11: 'JOBD and OBD II',
        12: 'JOBD and EOBD',
        13: 'JOBD, EOBD, and OBD II',
      };
      const bytes = extractDataBytes(data, '011C');
      const value = bytes.length >= 1 ? hexToDec(bytes[0]!) : 0;
      return standards[value] || `Unknown (${value})`;
    },
    unit: 'STRING',
  },

  RUNTIME: {
    name: 'RUNTIME',
    pid: '011F',
    description: 'Time Since Engine Start',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '011F');
      if (bytes.length >= 2) {
        return hexToDec(bytes[0]!) * 256 + hexToDec(bytes[1]!);
      }
      return 0;
    },
    unit: 'seconds',
  },

  VIN: {
    name: 'VIN',
    pid: '0902',
    description: 'Vehicle Identification Number',
    decoder: (data: string) => {
      const bytes = extractDataBytes(data, '0902');
      return bytes
        .map((b) => String.fromCharCode(hexToDec(b!)))
        .join('')
        .replace(/[^\x20-\x7E]/g, '');
    },
    unit: 'STRING',
  },
};

export function getCommandByPid(pid: string): OBD2Command | undefined {
  return Object.values(OBD2_COMMANDS).find((cmd) => cmd.pid === pid);
}

export function getAllCommands(): OBD2Command[] {
  return Object.values(OBD2_COMMANDS);
}

export function getCommandsByCategory(category: string): OBD2Command[] {
  // This is a simple implementation, we could add categories to OBD2Command interface
  if (category === 'MODE_01') {
    return Object.values(OBD2_COMMANDS).filter((cmd) => cmd.pid.startsWith('01'));
  }
  if (category === 'MODE_09') {
    return Object.values(OBD2_COMMANDS).filter((cmd) => cmd.pid.startsWith('09'));
  }
  return [];
}
