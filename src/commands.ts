import { OBD2Command } from './types';

// Standard OBD2 PIDs (Parameter IDs) with decoders
export const OBD2_COMMANDS: Record<string, OBD2Command> = {
  // Mode 01 - Current Data
  PIDS_00: {
    name: 'PIDS_00',
    pid: '0100',
    description: 'PIDs supported 00-20',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  DTC_STATUS: {
    name: 'DTC_STATUS',
    pid: '0101',
    description: 'Monitor status since DTCs cleared',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  DTC_CAUSE: {
    name: 'DTC_CAUSE',
    pid: '0102',
    description: 'DTC that caused required freeze frame data storage',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  FUEL_SYSTEM: {
    name: 'FUEL_SYSTEM',
    pid: '0103',
    description: 'Fuel system 1 and 2 status',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

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
    description: 'Short term fuel trim - Bank 1',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128) * 100 / 128,
    unit: '%'
  },

  LONG_FUEL_TRIM_1: {
    name: 'LONG_FUEL_TRIM_1',
    pid: '0107',
    description: 'Long term fuel trim - Bank 1',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128) * 100 / 128,
    unit: '%'
  },

  SHORT_FUEL_TRIM_2: {
    name: 'SHORT_FUEL_TRIM_2',
    pid: '0108',
    description: 'Short term fuel trim - Bank 2',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128) * 100 / 128,
    unit: '%'
  },

  LONG_FUEL_TRIM_2: {
    name: 'LONG_FUEL_TRIM_2',
    pid: '0109',
    description: 'Long term fuel trim - Bank 2',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128) * 100 / 128,
    unit: '%'
  },

  FUEL_RAIL_PRESSURE: {
    name: 'FUEL_RAIL_PRESSURE',
    pid: '010A',
    description: 'Fuel Rail Pressure (gauge)',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 3,
    unit: 'kPa'
  },

  INTAKE_PRESSURE: {
    name: 'INTAKE_PRESSURE',
    pid: '010B',
    description: 'Intake Manifold Absolute Pressure',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16),
    unit: 'kPa'
  },

  ENGINE_RPM: {
    name: 'ENGINE_RPM',
    pid: '010C',
    description: 'Engine RPM',
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
    description: 'Vehicle Speed Sensor',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16),
    unit: 'km/h'
  },

  TIMING_ADVANCE: {
    name: 'TIMING_ADVANCE',
    pid: '010E',
    description: 'Ignition Timing Advance for #1 Cylinder',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128) / 2,
    unit: '°'
  },

  INTAKE_TEMP: {
    name: 'INTAKE_TEMP',
    pid: '010F',
    description: 'Intake Air Temperature',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) - 40,
    unit: '°C'
  },

  MAF_RATE: {
    name: 'MAF_RATE',
    pid: '0110',
    description: 'Air Flow Rate from Mass Air Flow Sensor',
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
    description: 'Absolute Throttle Position',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  SECONDARY_AIR: {
    name: 'SECONDARY_AIR',
    pid: '0112',
    description: 'Commanded Secondary Air Status',
    decoder: (data: string) => data.substring(4, 6),
    unit: 'BIT'
  },

  O2_SENSORS: {
    name: 'O2_SENSORS',
    pid: '0113',
    description: 'O2 sensors present (8 banks)',
    decoder: (data: string) => data.substring(4, 6),
    unit: 'BIT'
  },

  O2_SENSOR_1: {
    name: 'O2_SENSOR_1',
    pid: '0114',
    description: 'Oxygen Sensor 1 (Bank 1) Voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
  },

  O2_SENSOR_2: {
    name: 'O2_SENSOR_2',
    pid: '0115',
    description: 'Oxygen Sensor 2 (Bank 1) Voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
  },

  O2_SENSOR_3: {
    name: 'O2_SENSOR_3',
    pid: '0116',
    description: 'Oxygen Sensor 3 (Bank 2) Voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
  },

  O2_SENSOR_4: {
    name: 'O2_SENSOR_4',
    pid: '0117',
    description: 'Oxygen Sensor 4 (Bank 2) Voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
  },

  O2_SENSOR_5: {
    name: 'O2_SENSOR_5',
    pid: '0118',
    description: 'Oxygen Sensor 5 (Bank 3) Voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
  },

  O2_SENSOR_6: {
    name: 'O2_SENSOR_6',
    pid: '0119',
    description: 'Oxygen Sensor 6 (Bank 3) Voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
  },

  O2_SENSOR_7: {
    name: 'O2_SENSOR_7',
    pid: '011A',
    description: 'Oxygen Sensor 7 (Bank 4) Voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
  },

  O2_SENSOR_8: {
    name: 'O2_SENSOR_8',
    pid: '011B',
    description: 'Oxygen Sensor 8 (Bank 4) Voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
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
        13: 'JOBD, EOBD, and OBD II'
      };
      const value = parseInt(data.substring(4, 6), 16);
      return standards[value] || `Unknown (${value})`;
    }
  },

  O2_SENSOR_VOLTAGE: {
    name: 'O2_SENSOR_VOLTAGE',
    pid: '011D',
    description: 'Oxygen Sensor Voltage',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) / 200,
    unit: 'V'
  },

  O2_SENSOR_TRIM: {
    name: 'O2_SENSOR_TRIM',
    pid: '011E',
    description: 'Oxygen Sensor Fuel Trim (Bank 1)',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128),
    unit: '%'
  },

  RUNTIME: {
    name: 'RUNTIME',
    pid: '011F',
    description: 'Time Since Engine Start',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return a * 256 + b;
    },
    unit: 'seconds'
  },

  PIDS_20: {
    name: 'PIDS_20',
    pid: '0120',
    description: 'PIDs supported 21-40',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  DIST_MIL: {
    name: 'DIST_MIL',
    pid: '0121',
    description: 'Distance Travelled While MIL is Activated',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return a * 256 + b;
    },
    unit: 'km'
  },

  FUEL_RAIL_PRESSURE_VAC: {
    name: 'FUEL_RAIL_PRESSURE_VAC',
    pid: '0122',
    description: 'Fuel Rail Pressure relative to manifold vacuum',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) * 0.079;
    },
    unit: 'kPa'
  },

  FUEL_RAIL_PRESSURE_DIESEL: {
    name: 'FUEL_RAIL_PRESSURE_DIESEL',
    pid: '0123',
    description: 'Fuel Rail Pressure (diesel)',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) * 10;
    },
    unit: 'kPa'
  },

  CMD_EGR: {
    name: 'CMD_EGR',
    pid: '012C',
    description: 'Commanded EGR',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  EGR_ERROR: {
    name: 'EGR_ERROR',
    pid: '012D',
    description: 'EGR Error',
    decoder: (data: string) => (parseInt(data.substring(4, 6), 16) - 128) * 100 / 128,
    unit: '%'
  },

  CMD_EVAP: {
    name: 'CMD_EVAP',
    pid: '012E',
    description: 'Commanded Evaporative Purge',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  FUEL_LEVEL: {
    name: 'FUEL_LEVEL',
    pid: '012F',
    description: 'Fuel Level Input',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  WARM_UPS: {
    name: 'WARM_UPS',
    pid: '0130',
    description: 'Number of warm-ups since diagnostic trouble codes cleared',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16),
    unit: 'pcs'
  },

  DIST_CLR: {
    name: 'DIST_CLR',
    pid: '0131',
    description: 'Distance since diagnostic trouble codes cleared',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return a * 256 + b;
    },
    unit: 'km'
  },

  EVAP_VAPOR: {
    name: 'EVAP_VAPOR',
    pid: '0132',
    description: 'Evap System Vapour Pressure',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) - 32767;
    },
    unit: 'Pa'
  },

  BAROMETRIC_PRESSURE: {
    name: 'BAROMETRIC_PRESSURE',
    pid: '0133',
    description: 'Barometric Pressure',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16),
    unit: 'kPa'
  },

  CAT_TEMP_B1S1: {
    name: 'CAT_TEMP_B1S1',
    pid: '013C',
    description: 'Catalyst Temperature Bank 1 / Sensor 1',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 10 - 40;
    },
    unit: '°C'
  },

  CAT_TEMP_B2S1: {
    name: 'CAT_TEMP_B2S1',
    pid: '013D',
    description: 'Catalyst Temperature Bank 2 / Sensor 1',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 10 - 40;
    },
    unit: '°C'
  },

  CAT_TEMP_B1S2: {
    name: 'CAT_TEMP_B1S2',
    pid: '013E',
    description: 'Catalyst Temperature Bank 1 / Sensor 2',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 10 - 40;
    },
    unit: '°C'
  },

  CAT_TEMP_B2S2: {
    name: 'CAT_TEMP_B2S2',
    pid: '013F',
    description: 'Catalyst Temperature Bank 2 / Sensor 2',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 10 - 40;
    },
    unit: '°C'
  },

  PIDS_40: {
    name: 'PIDS_40',
    pid: '0140',
    description: 'PIDs supported 41-60',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  MONITOR_STATUS: {
    name: 'MONITOR_STATUS',
    pid: '0141',
    description: 'Monitor status this driving cycle',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  CONTROL_VOLTAGE: {
    name: 'CONTROL_VOLTAGE',
    pid: '0142',
    description: 'Control module voltage',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 1000;
    },
    unit: 'V'
  },

  ABSOLUTE_LOAD: {
    name: 'ABSOLUTE_LOAD',
    pid: '0143',
    description: 'Absolute Load Value',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) * 100 / 255;
    },
    unit: '%'
  },

  EQUIV_RATIO: {
    name: 'EQUIV_RATIO',
    pid: '0144',
    description: 'Fuel/air Commanded Equivalence Ratio',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 32768;
    },
    unit: 'ratio'
  },

  REL_THROTTLE: {
    name: 'REL_THROTTLE',
    pid: '0145',
    description: 'Relative Throttle Position',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  AMBIENT_TEMP: {
    name: 'AMBIENT_TEMP',
    pid: '0146',
    description: 'Ambient air temperature',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) - 40,
    unit: '°C'
  },

  THROTTLE_POS_B: {
    name: 'THROTTLE_POS_B',
    pid: '0147',
    description: 'Absolute Throttle Position B',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  THROTTLE_POS_C: {
    name: 'THROTTLE_POS_C',
    pid: '0148',
    description: 'Absolute Throttle Position C',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  ACC_PEDAL_D: {
    name: 'ACC_PEDAL_D',
    pid: '0149',
    description: 'Accelerator Pedal Position D',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  ACC_PEDAL_E: {
    name: 'ACC_PEDAL_E',
    pid: '014A',
    description: 'Accelerator Pedal Position E',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  ACC_PEDAL_F: {
    name: 'ACC_PEDAL_F',
    pid: '014B',
    description: 'Accelerator Pedal Position F',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  TAC_CONTROL: {
    name: 'TAC_CONTROL',
    pid: '014C',
    description: 'Commanded Throttle Actuator Control',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  MIL_TIME: {
    name: 'MIL_TIME',
    pid: '014D',
    description: 'Time run by the engine while MIL activated',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return a * 256 + b;
    },
    unit: 'min'
  },

  CLR_TIME: {
    name: 'CLR_TIME',
    pid: '014E',
    description: 'Time since diagnostic trouble codes cleared',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return a * 256 + b;
    },
    unit: 'min'
  },

  FUEL_TYPE: {
    name: 'FUEL_TYPE',
    pid: '0151',
    description: 'Fuel Type',
    decoder: (data: string) => {
      const types: Record<number, string> = {
        1: 'Gasoline',
        2: 'Methanol',
        3: 'Ethanol',
        4: 'Diesel',
        5: 'LPG',
        6: 'CNG',
        7: 'Propane',
        8: 'Electric',
        9: 'Bifuel Gasoline',
        10: 'Bifuel Methanol',
        11: 'Bifuel Ethanol',
        12: 'Bifuel Diesel',
        13: 'Bifuel CNG',
        14: 'Bifuel Propane'
      };
      const value = parseInt(data.substring(4, 6), 16);
      return types[value] || `Unknown (${value})`;
    }
  },

  ETHANOL_PERCENT: {
    name: 'ETHANOL_PERCENT',
    pid: '0152',
    description: 'Ethanol fuel %',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  EVAP_VAPOR_ABS: {
    name: 'EVAP_VAPOR_ABS',
    pid: '0153',
    description: 'Absolute Evap system Vapor Pressure',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 1000;
    },
    unit: 'kPa'
  },

  EVAP_VAPOR_REL: {
    name: 'EVAP_VAPOR_REL',
    pid: '0154',
    description: 'Evap system vapor pressure',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) - 32767;
    },
    unit: 'Pa'
  },

  ACC_PEDAL_POS: {
    name: 'ACC_PEDAL_POS',
    pid: '015A',
    description: 'Relative accelerator pedal position',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  HYBRID_BATT: {
    name: 'HYBRID_BATT',
    pid: '015B',
    description: 'Hybrid battery pack remaining life',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) * 100 / 255,
    unit: '%'
  },

  OIL_TEMP: {
    name: 'OIL_TEMP',
    pid: '015C',
    description: 'Engine oil temperature',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) - 40,
    unit: '°C'
  },

  FUEL_INJECT_TIMING: {
    name: 'FUEL_INJECT_TIMING',
    pid: '015D',
    description: 'Fuel injection timing',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 128 - 210;
    },
    unit: '°'
  },

  FUEL_RATE: {
    name: 'FUEL_RATE',
    pid: '015E',
    description: 'Engine fuel rate',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return (a * 256 + b) / 100;
    },
    unit: 'L/h'
  },

  PIDS_60: {
    name: 'PIDS_60',
    pid: '0160',
    description: 'PIDs supported 61-80',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  DRIVER_TORQUE: {
    name: 'DRIVER_TORQUE',
    pid: '0161',
    description: "Driver's demand engine percent torque",
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) - 125,
    unit: '%'
  },

  ACTUAL_TORQUE: {
    name: 'ACTUAL_TORQUE',
    pid: '0162',
    description: 'Actual engine percent torque',
    decoder: (data: string) => parseInt(data.substring(4, 6), 16) - 125,
    unit: '%'
  },

  ENGINE_TORQUE: {
    name: 'ENGINE_TORQUE',
    pid: '0163',
    description: 'Engine reference torque',
    decoder: (data: string) => {
      const a = parseInt(data.substring(4, 6), 16);
      const b = parseInt(data.substring(6, 8), 16);
      return a * 256 + b;
    },
    unit: 'Nm'
  },

  PIDS_80: {
    name: 'PIDS_80',
    pid: '0180',
    description: 'PIDs supported 81-A0',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  PIDS_A0: {
    name: 'PIDS_A0',
    pid: '01A0',
    description: 'PIDs supported A1-C0',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  PIDS_C0: {
    name: 'PIDS_C0',
    pid: '01C0',
    description: 'PIDs supported C1-E0',
    decoder: (data: string) => data.substring(4),
    unit: 'BIT'
  },

  // Mode 03 - Read DTCs
  READ_DTC: {
    name: 'READ_DTC',
    pid: '0300',
    description: 'Stored DTCs',
    decoder: (data: string) => data.substring(4)
  },

  // Mode 04 - Clear DTCs
  CLEAR_DTC: {
    name: 'CLEAR_DTC',
    pid: '0400',
    description: 'Clear Trouble Codes',
    decoder: (data: string) => 'Cleared'
  },

  // Mode 09 - Vehicle Information
  VIN: {
    name: 'VIN',
    pid: '0902',
    description: 'Vehicle Identification Number',
    decoder: (data: string) => {
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
  },

  ECU_NAME: {
    name: 'ECU_NAME',
    pid: '090A',
    description: 'ECU Name',
    decoder: (data: string) => {
      const hex = data.replace(/[^0-9A-F]/g, '');
      let name = '';
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16);
        if (charCode >= 32 && charCode <= 126) {
          name += String.fromCharCode(charCode);
        }
      }
      return name.trim();
    }
  }
};

// Utility function to get command by PID
export function getCommandByPid(pid: string): OBD2Command | undefined {
  return Object.values(OBD2_COMMANDS).find(cmd => cmd.pid.toLowerCase() === pid.toLowerCase());
}

// Utility function to get all available commands
export function getAllCommands(): OBD2Command[] {
  // Return unique commands only (filter out aliases)
  const seen = new Set<string>();
  return Object.values(OBD2_COMMANDS).filter(cmd => {
    if (seen.has(cmd.pid)) return false;
    seen.add(cmd.pid);
    return true;
  });
}

// Utility function to get commands by category
export function getCommandsByCategory(category: 'engine' | 'fuel' | 'temperature' | 'sensors' | 'info' | 'status'): OBD2Command[] {
  const categories: Record<string, string[]> = {
    engine: ['ENGINE_LOAD', 'ENGINE_RPM', 'TIMING_ADVANCE', 'RUNTIME', 'ACTUAL_TORQUE', 'DRIVER_TORQUE', 'ENGINE_TORQUE'],
    fuel: ['SHORT_FUEL_TRIM_1', 'LONG_FUEL_TRIM_1', 'SHORT_FUEL_TRIM_2', 'LONG_FUEL_TRIM_2', 'FUEL_LEVEL', 'FUEL_RAIL_PRESSURE', 'FUEL_RAIL_PRESSURE_VAC', 'FUEL_RAIL_PRESSURE_DIESEL', 'FUEL_RATE', 'FUEL_INJECT_TIMING'],
    temperature: ['COOLANT_TEMP', 'INTAKE_TEMP', 'AMBIENT_TEMP', 'OIL_TEMP', 'CAT_TEMP_B1S1', 'CAT_TEMP_B2S1', 'CAT_TEMP_B1S2', 'CAT_TEMP_B2S2'],
    sensors: ['INTAKE_PRESSURE', 'MAF_RATE', 'THROTTLE_POS', 'O2_SENSOR_1', 'BAROMETRIC_PRESSURE', 'REL_THROTTLE', 'ACC_PEDAL_D', 'ACC_PEDAL_E', 'ACC_PEDAL_F', 'EQUIV_RATIO'],
    info: ['OBD_STANDARDS', 'VIN', 'ECU_NAME', 'CONTROL_VOLTAGE', 'FUEL_TYPE', 'ETHANOL_PERCENT'],
    status: ['PIDS_00', 'PIDS_20', 'PIDS_40', 'PIDS_60', 'PIDS_80', 'PIDS_A0', 'PIDS_C0', 'DTC_STATUS', 'MONITOR_STATUS', 'READ_DTC']
  };

  return categories[category]?.map(name => OBD2_COMMANDS[name]).filter(Boolean) as OBD2Command[] || [];
}