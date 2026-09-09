// apps/technician-app/src/services/DeviceConfigService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_TYPES_KEY = 'device_types_config';

export interface DeviceFieldOption {
  id: string;
  label: string;
  value: string;
}

export interface DeviceField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'boolean';
  required: boolean;
  placeholder?: string;
  options?: DeviceFieldOption[];
  defaultValue?: any;
}

export interface DeviceType {
  id: string;
  name: string;
  icon: string;
  fields: DeviceField[];
  isActive: boolean;
  createdAt: string;
}

export class DeviceConfigService {
  static async getDeviceTypes(): Promise<DeviceType[]> {
    try {
      const data = await AsyncStorage.getItem(DEVICE_TYPES_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Return default device types if none exist
      return this.getDefaultDeviceTypes();
    } catch (error) {
      console.error('Error getting device types:', error);
      return this.getDefaultDeviceTypes();
    }
  }

  static async getDeviceTypeById(id: string): Promise<DeviceType | null> {
    try {
      const types = await this.getDeviceTypes();
      return types.find(t => t.id === id) || null;
    } catch (error) {
      console.error('Error getting device type:', error);
      return null;
    }
  }

  static async getDeviceTypeByName(name: string): Promise<DeviceType | null> {
    try {
      const types = await this.getDeviceTypes();
      return types.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
      console.error('Error getting device type by name:', error);
      return null;
    }
  }

  static async saveDeviceType(deviceType: DeviceType): Promise<void> {
    try {
      const types = await this.getDeviceTypes();
      const existingIndex = types.findIndex(t => t.id === deviceType.id);
      
      if (existingIndex >= 0) {
        types[existingIndex] = deviceType;
      } else {
        types.push(deviceType);
      }
      
      await AsyncStorage.setItem(DEVICE_TYPES_KEY, JSON.stringify(types));
    } catch (error) {
      console.error('Error saving device type:', error);
      throw error;
    }
  }

  static async deleteDeviceType(id: string): Promise<void> {
    try {
      const types = await this.getDeviceTypes();
      const filtered = types.filter(t => t.id !== id);
      await AsyncStorage.setItem(DEVICE_TYPES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting device type:', error);
      throw error;
    }
  }

  static async updateDeviceField(
    deviceTypeId: string,
    fieldId: string,
    updates: Partial<DeviceField>
  ): Promise<DeviceType | null> {
    try {
      const types = await this.getDeviceTypes();
      const typeIndex = types.findIndex(t => t.id === deviceTypeId);
      
      if (typeIndex === -1) return null;
      
      const fieldIndex = types[typeIndex].fields.findIndex(f => f.id === fieldId);
      
      if (fieldIndex === -1) return null;
      
      types[typeIndex].fields[fieldIndex] = {
        ...types[typeIndex].fields[fieldIndex],
        ...updates,
      };
      
      await AsyncStorage.setItem(DEVICE_TYPES_KEY, JSON.stringify(types));
      return types[typeIndex];
    } catch (error) {
      console.error('Error updating device field:', error);
      throw error;
    }
  }

  static async addDeviceField(
    deviceTypeId: string,
    field: Omit<DeviceField, 'id'>
  ): Promise<DeviceType | null> {
    try {
      const types = await this.getDeviceTypes();
      const typeIndex = types.findIndex(t => t.id === deviceTypeId);
      
      if (typeIndex === -1) return null;
      
      const newField: DeviceField = {
        ...field,
        id: Date.now().toString(),
      };
      
      types[typeIndex].fields.push(newField);
      await AsyncStorage.setItem(DEVICE_TYPES_KEY, JSON.stringify(types));
      return types[typeIndex];
    } catch (error) {
      console.error('Error adding device field:', error);
      throw error;
    }
  }

  static async removeDeviceField(
    deviceTypeId: string,
    fieldId: string
  ): Promise<DeviceType | null> {
    try {
      const types = await this.getDeviceTypes();
      const typeIndex = types.findIndex(t => t.id === deviceTypeId);
      
      if (typeIndex === -1) return null;
      
      types[typeIndex].fields = types[typeIndex].fields.filter(f => f.id !== fieldId);
      await AsyncStorage.setItem(DEVICE_TYPES_KEY, JSON.stringify(types));
      return types[typeIndex];
    } catch (error) {
      console.error('Error removing device field:', error);
      throw error;
    }
  }

  static async getFieldOptionsByDeviceType(deviceType: string): Promise<Record<string, any>> {
    try {
      const type = await this.getDeviceTypeByName(deviceType);
      if (!type) return {};
      
      const options: Record<string, any> = {};
      type.fields.forEach(field => {
        if (field.type === 'select' && field.options) {
          options[field.name] = field.options;
        }
      });
      return options;
    } catch (error) {
      console.error('Error getting field options:', error);
      return {};
    }
  }

  private static getDefaultDeviceTypes(): DeviceType[] {
    return [
      {
        id: '1',
        name: 'Motor',
        icon: '⚡',
        isActive: true,
        createdAt: new Date().toISOString(),
        fields: [
          {
            id: 'm1',
            name: 'motorType',
            label: 'Motor Type',
            type: 'select',
            required: true,
            options: [
              { id: 'm1_o1', label: 'Induction', value: 'induction' },
              { id: 'm1_o2', label: 'Universal', value: 'universal' },
              { id: 'm1_o3', label: 'Synchronous', value: 'synchronous' },
              { id: 'm1_o4', label: 'DC', value: 'dc' },
            ],
          },
          { 
            id: 'm2', 
            name: 'rpm', 
            label: 'RPM', 
            type: 'number', 
            required: true, 
            placeholder: 'e.g., 1440' 
          },
          { 
            id: 'm3', 
            name: 'voltage', 
            label: 'Voltage (V)', 
            type: 'number', 
            required: true, 
            placeholder: 'e.g., 230' 
          },
          { 
            id: 'm4', 
            name: 'amps', 
            label: 'Amps (A)', 
            type: 'number', 
            required: true, 
            placeholder: 'e.g., 5' 
          },
          { 
            id: 'm5', 
            name: 'hp', 
            label: 'HP', 
            type: 'number', 
            required: true, 
            placeholder: 'e.g., 1.5' 
          },
          { 
            id: 'm6', 
            name: 'frequency', 
            label: 'Frequency (Hz)', 
            type: 'number', 
            required: false,
            placeholder: 'e.g., 50' 
          },
          { 
            id: 'm7', 
            name: 'coreLength', 
            label: 'Core Length (mm)', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'm8', 
            name: 'coreDiameter', 
            label: 'Core Diameter (mm)', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'm9', 
            name: 'slots', 
            label: 'Number of Slots', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'm10', 
            name: 'coils', 
            label: 'Number of Coils', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'm11', 
            name: 'wireGauge', 
            label: 'Wire Gauge (SWG)', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'm12', 
            name: 'turnsPerCoil', 
            label: 'Turns per Coil', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'm13', 
            name: 'weight', 
            label: 'Net Weight (kg)', 
            type: 'number',
            required: false
          },
          { 
            id: 'm14', 
            name: 'bearings', 
            label: 'Bearings', 
            type: 'text', 
            placeholder: 'e.g., 6203-2RS',
            required: false 
          },
          { 
            id: 'm15', 
            name: 'notes', 
            label: 'Special Notes', 
            type: 'textarea',
            required: false
          },
        ],
      },
      {
        id: '2',
        name: 'ac_repair',
        icon: '❄️',
        isActive: true,
        createdAt: new Date().toISOString(),
        fields: [
          {
            id: 'a1',
            name: 'acType',
            label: 'AC Type',
            type: 'select',
            required: true,
            options: [
              { id: 'a1_o1', label: 'Split', value: 'split' },
              { id: 'a1_o2', label: 'Window', value: 'window' },
              { id: 'a1_o3', label: 'Cassette', value: 'cassette' },
              { id: 'a1_o4', label: 'Portable', value: 'portable' },
            ],
          },
          { 
            id: 'a2', 
            name: 'tonnage', 
            label: 'Tonnage', 
            type: 'number', 
            required: true, 
            placeholder: 'e.g., 1.5' 
          },
          {
            id: 'a3',
            name: 'refrigerant',
            label: 'Refrigerant Type',
            type: 'select',
            required: true,
            options: [
              { id: 'a3_o1', label: 'R32', value: 'r32' },
              { id: 'a3_o2', label: 'R410A', value: 'r410a' },
              { id: 'a3_o3', label: 'R22', value: 'r22' },
              { id: 'a3_o4', label: 'R134A', value: 'r134a' },
            ],
          },
          { 
            id: 'a4', 
            name: 'gasCharge', 
            label: 'Gas Charge (g)', 
            type: 'number', 
            required: true 
          },
          {
            id: 'a5',
            name: 'compressorType',
            label: 'Compressor Type',
            type: 'select',
            options: [
              { id: 'a5_o1', label: 'Rotary', value: 'rotary' },
              { id: 'a5_o2', label: 'Scroll', value: 'scroll' },
              { id: 'a5_o3', label: 'Reciprocating', value: 'reciprocating' },
            ],
            required: false,
          },
          { 
            id: 'a6', 
            name: 'coilType', 
            label: 'Coil Type', 
            type: 'text', 
            placeholder: 'e.g., Copper, Aluminum',
            required: false
          },
          { 
            id: 'a7', 
            name: 'compressorOil', 
            label: 'Compressor Oil (ml)', 
            type: 'number',
            required: false
          },
          { 
            id: 'a8', 
            name: 'capacitor', 
            label: 'Capacitor (µF)', 
            type: 'number',
            required: false
          },
          { 
            id: 'a9', 
            name: 'notes', 
            label: 'Special Notes', 
            type: 'textarea',
            required: false
          },
        ],
      },
      {
        id: '3',
        name: 'Refrigerator',
        icon: '🧊',
        isActive: true,
        createdAt: new Date().toISOString(),
        fields: [
          {
            id: 'r1',
            name: 'fridgeType',
            label: 'Refrigerator Type',
            type: 'select',
            required: true,
            options: [
              { id: 'r1_o1', label: 'Single Door', value: 'single_door' },
              { id: 'r1_o2', label: 'Double Door', value: 'double_door' },
              { id: 'r1_o3', label: 'Side-by-Side', value: 'side_by_side' },
              { id: 'r1_o4', label: 'French Door', value: 'french_door' },
            ],
          },
          { 
            id: 'r2', 
            name: 'capacity', 
            label: 'Capacity (Liters)', 
            type: 'number', 
            required: true 
          },
          {
            id: 'r3',
            name: 'refrigerant',
            label: 'Refrigerant Type',
            type: 'select',
            required: true,
            options: [
              { id: 'r3_o1', label: 'R600a', value: 'r600a' },
              { id: 'r3_o2', label: 'R134a', value: 'r134a' },
            ],
          },
          { 
            id: 'r4', 
            name: 'compressorType', 
            label: 'Compressor Type', 
            type: 'text',
            required: false
          },
          { 
            id: 'r5', 
            name: 'thermostat', 
            label: 'Thermostat Setting', 
            type: 'text',
            required: false
          },
          { 
            id: 'r6', 
            name: 'notes', 
            label: 'Special Notes', 
            type: 'textarea',
            required: false
          },
        ],
      },
      {
        id: '4',
        name: 'Washing Machine',
        icon: '🧺',
        isActive: true,
        createdAt: new Date().toISOString(),
        fields: [
          {
            id: 'w1',
            name: 'machineType',
            label: 'Machine Type',
            type: 'select',
            required: true,
            options: [
              { id: 'w1_o1', label: 'Front Load', value: 'front_load' },
              { id: 'w1_o2', label: 'Top Load', value: 'top_load' },
              { id: 'w1_o3', label: 'Semi-Automatic', value: 'semi_automatic' },
            ],
          },
          { 
            id: 'w2', 
            name: 'capacity', 
            label: 'Capacity (kg)', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'w3', 
            name: 'motorType', 
            label: 'Motor Type', 
            type: 'text', 
            placeholder: 'e.g., BLDC, Universal',
            required: false
          },
          { 
            id: 'w4', 
            name: 'beltType', 
            label: 'Belt Type', 
            type: 'text', 
            placeholder: 'e.g., V-Belt, Flat',
            required: false
          },
          { 
            id: 'w5', 
            name: 'heatingElement', 
            label: 'Heating Element (W)', 
            type: 'number',
            required: false
          },
          { 
            id: 'w6', 
            name: 'notes', 
            label: 'Special Notes', 
            type: 'textarea',
            required: false
          },
        ],
      },
      {
        id: '5',
        name: 'Water Pump',
        icon: '💧',
        isActive: true,
        createdAt: new Date().toISOString(),
        fields: [
          {
            id: 'p1',
            name: 'pumpType',
            label: 'Pump Type',
            type: 'select',
            required: true,
            options: [
              { id: 'p1_o1', label: 'Centrifugal', value: 'centrifugal' },
              { id: 'p1_o2', label: 'Submersible', value: 'submersible' },
              { id: 'p1_o3', label: 'Jet Pump', value: 'jet' },
              { id: 'p1_o4', label: 'Booster', value: 'booster' },
            ],
          },
          { 
            id: 'p2', 
            name: 'hp', 
            label: 'HP', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'p3', 
            name: 'voltage', 
            label: 'Voltage (V)', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'p4', 
            name: 'amps', 
            label: 'Amps (A)', 
            type: 'number', 
            required: true 
          },
          { 
            id: 'p5', 
            name: 'flowRate', 
            label: 'Flow Rate (L/min)', 
            type: 'number',
            required: false
          },
          { 
            id: 'p6', 
            name: 'headHeight', 
            label: 'Head Height (m)', 
            type: 'number',
            required: false
          },
          { 
            id: 'p7', 
            name: 'notes', 
            label: 'Special Notes', 
            type: 'textarea',
            required: false 
          },
        ],
      },
    ];
  }
}