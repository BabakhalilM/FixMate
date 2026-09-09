// apps/technician-app/src/components/DeviceSpecsForm.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// import DynamicDeviceSpecsForm from './DynamicDeviceSpecsForm';
import DynamicDeviceSpecsForm from '@/screens/DynamicDeviceSpecsForm';

interface DeviceSpecsFormProps {
  deviceType: string;
  specs: any;
  onSpecsChange: (specs: any) => void;
}

/**
 * This component serves as a compatibility layer.
 * It redirects to the new DynamicDeviceSpecsForm which is more flexible.
 * This ensures backward compatibility with existing code.
 */
export default function DeviceSpecsForm({ 
  deviceType, 
  specs, 
  onSpecsChange 
}: DeviceSpecsFormProps) {
  return (
    <DynamicDeviceSpecsForm
      deviceType={deviceType}
      specs={specs}
      onSpecsChange={onSpecsChange}
    />
  );
}

// Export the dynamic version as well for direct use
export { DynamicDeviceSpecsForm };