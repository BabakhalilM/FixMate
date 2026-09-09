// apps/technician-app/src/services/DeviceService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICES_KEY = 'technician_devices';

export interface Device {
  id: string;
  name: string;
  brand: string;
  model: string;
  specialty: string;
  price: number;
  estimatedTime: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export class DeviceService {
  static async getDevices(): Promise<Device[]> {
    try {
      const data = await AsyncStorage.getItem(DEVICES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  }

  static async getDeviceById(id: string): Promise<Device | null> {
    try {
      const devices = await this.getDevices();
      return devices.find(d => d.id === id) || null;
    } catch (error) {
      console.error('Error getting device:', error);
      return null;
    }
  }

  static async getDevicesBySpecialty(specialty: string): Promise<Device[]> {
    try {
      const devices = await this.getDevices();
      return devices.filter(d => d.specialty === specialty);
    } catch (error) {
      console.error('Error getting devices by specialty:', error);
      return [];
    }
  }

  static async getActiveDevices(): Promise<Device[]> {
    try {
      const devices = await this.getDevices();
      return devices.filter(d => d.isActive);
    } catch (error) {
      console.error('Error getting active devices:', error);
      return [];
    }
  }

  static async saveDevice(device: Device): Promise<Device> {
    try {
      const devices = await this.getDevices();
      const existingIndex = devices.findIndex(d => d.id === device.id);
      
      if (existingIndex >= 0) {
        devices[existingIndex] = { ...device, updatedAt: new Date().toISOString() };
      } else {
        devices.push({ 
          ...device, 
          createdAt: device.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
      return device;
    } catch (error) {
      console.error('Error saving device:', error);
      throw error;
    }
  }

  static async deleteDevice(id: string): Promise<void> {
    try {
      const devices = await this.getDevices();
      const filtered = devices.filter(d => d.id !== id);
      await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }

  static async updateDeviceStatus(id: string, isActive: boolean): Promise<Device | null> {
    try {
      const devices = await this.getDevices();
      const index = devices.findIndex(d => d.id === id);
      
      if (index === -1) return null;
      
      devices[index] = {
        ...devices[index],
        isActive,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
      return devices[index];
    } catch (error) {
      console.error('Error updating device status:', error);
      throw error;
    }
  }

  static async searchDevices(query: string): Promise<Device[]> {
    try {
      const devices = await this.getDevices();
      const searchLower = query.toLowerCase();
      return devices.filter(d =>
        d.name.toLowerCase().includes(searchLower) ||
        d.brand.toLowerCase().includes(searchLower) ||
        d.model.toLowerCase().includes(searchLower) ||
        d.specialty.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching devices:', error);
      return [];
    }
  }

  static async getDeviceStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    bySpecialty: Record<string, number>;
  }> {
    try {
      const devices = await this.getDevices();
      const bySpecialty: Record<string, number> = {};
      
      devices.forEach(d => {
        bySpecialty[d.specialty] = (bySpecialty[d.specialty] || 0) + 1;
      });
      
      return {
        total: devices.length,
        active: devices.filter(d => d.isActive).length,
        inactive: devices.filter(d => !d.isActive).length,
        bySpecialty,
      };
    } catch (error) {
      console.error('Error getting device statistics:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        bySpecialty: {},
      };
    }
  }
}