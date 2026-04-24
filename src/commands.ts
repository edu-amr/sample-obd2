import { OBD2Command } from './types';

// Standard OBD2 PIDs (Parameter IDs) with decoders
export const OBD2_COMMANDS: Record<string, OBD2Command> = {
  // Mode 01 - Current Data
  ENGINE_LOAD: {
    name: 'ENGINE_LOAD',
    pid: '0104',
    description: 'Calculated engine load',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  COOLANT_TEMP: {
    name: 'COOLANT_TEMP',
    pid: '0105',
    description: 'Engine coolant temperature',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) - 40,
    unit: '°C'
  },

  SHORT_FUEL_TRIM_1: {
    name: 'SHORT_FUEL_TRIM_1',
    pid: '0106',
    description: 'Short term fuel trim—Bank 1',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128) * 100 / 128,
    unit: '%'
  },

  LONG_FUEL_TRIM_1: {
    name: 'LONG_FUEL_TRIM_1',
    pid: '0107',
    description: 'Long term fuel trim—Bank 1',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128) * 100 / 128,
    unit: '%'
  },

  INTAKE_PRESSURE: {
    name: 'INTAKE_PRESSURE',
    pid: '010B',
    description: 'Intake manifold absolute pressure',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16),
    unit: 'kPa'
  },

  ENGINE_RPM: {
    name: 'ENGINE_RPM',
    pid: '010C',
    description: 'Engine speed',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 4;
    },
    unit: 'rpm'
  },

  VEHICLE_SPEED: {
    name: 'VEHICLE_SPEED',
    pid: '010D',
    description: 'Vehicle speed',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16),
    unit: 'km/h'
  },

  TIMING_ADVANCE: {
    name: 'TIMING_ADVANCE',
    pid: '010E',
    description: 'Timing advance',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128) / 2,
    unit: '°'
  },

  INTAKE_TEMP: {
    name: 'INTAKE_TEMP',
    pid: '010F',
    description: 'Intake air temperature',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) - 40,
    unit: '°C'
  },

  MAF_RATE: {
    name: 'MAF_RATE',
    pid: '0110',
    description: 'Mass air flow sensor air flow rate',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 100;
    },
    unit: 'g/s'
  },

  THROTTLE_POS: {
    name: 'THROTTLE_POS',
    pid: '0111',
    description: 'Throttle position',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  O2_SENSOR_1: {
    name: 'O2_SENSOR_1',
    pid: '0114',
    description: 'Oxygen sensor 1 voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
  },

  OBD_STANDARDS: {
    name: 'OBD_STANDARDS',
    pid: '011C',
    description: 'OBD standards this vehicle conforms to',
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
        13: 'JOBD, EOBD, and OBD II'
      };
      const value = parseInt(data.substring(4, 6), 16);
      return standards[value] || `Unknown (${value})`;
    }
  },

  RUNTIME: {
    name: 'RUNTIME',
    pid: '011F',
    description: 'Run time since engine start',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return a * 256 + b;
    },
    unit: 'seconds'
  },

  FUEL_LEVEL: {
    name: 'FUEL_LEVEL',
    pid: '012F',
    description: 'Fuel tank level input',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  BAROMETRIC_PRESSURE: {
    name: 'BAROMETRIC_PRESSURE',
    pid: '0133',
    description: 'Absolute Barometric Pressure',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16),
    unit: 'kPa'
  },

  AMBIENT_TEMP: {
    name: 'AMBIENT_TEMP',
    pid: '0146',
    description: 'Ambient air temperature',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) - 40,
    unit: '°C'
  },

  // Mode 09 - Vehicle Information
  VIN: {
    name: 'VIN',
    pid: '0902',
    description: 'Vehicle Identification Number',
    decoder: (data: string) => {
      // VIN is returned in multiple frames, this is a simplified decoder
      const hex = data.replace(/[^0-9A-F]/g, '');
      let vin = '';
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16);
        if (charCode >= 32 && charCode <= 126) {
          vin += String.fromCharCode(charCode);
        }
      }
      return vin.trim();
    }
  }
};

// Utility function to get command by PID
export function getCommandByPid(pid: string): OBD2Command | undefined {
  return Object.values(OBD2_COMMANDS).find(cmd => cmd.pid.toLowerCase() === pid.toLowerCase());
}

// Utility function to get all available commands
export function getAllCommands(): OBD2Command[] {
  return Object.values(OBD2_COMMANDS);
}

// Utility function to get commands by category
export function getCommandsByCategory(category: 'engine' | 'fuel' | 'temperature' | 'sensors' | 'info'): OBD2Command[] {
  const categories = {
    engine: ['ENGINE_LOAD', 'ENGINE_RPM', 'TIMING_ADVANCE', 'RUNTIME'],
    fuel: ['SHORT_FUEL_TRIM_1', 'LONG_FUEL_TRIM_1', 'FUEL_LEVEL'],
    temperature: ['COOLANT_TEMP', 'INTAKE_TEMP', 'AMBIENT_TEMP'],
    sensors: ['INTAKE_PRESSURE', 'MAF_RATE', 'THROTTLE_POS', 'O2_SENSOR_1', 'BAROMETRIC_PRESSURE'],
    info: ['OBD_STANDARDS', 'VIN']
  };

  return categories[category]?.map(name => OBD2_COMMANDS[name]).filter(Boolean) as OBD2Command[] || [];
}
