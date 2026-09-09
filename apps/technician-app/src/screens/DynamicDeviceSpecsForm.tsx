// apps/technician-app/src/components/DynamicDeviceSpecsForm.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { DeviceConfigService } from '../services/DeviceConfigService';

interface DynamicDeviceSpecsFormProps {
  deviceType: string;
  specs: any;
  onSpecsChange: (specs: any) => void;
}

export default function DynamicDeviceSpecsForm({
  deviceType,
  specs,
  onSpecsChange,
}: DynamicDeviceSpecsFormProps) {
  const [deviceConfig, setDeviceConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [activeField, setActiveField] = useState<any>(null);

  useEffect(() => {
    loadDeviceConfig();
  }, [deviceType]);

  const loadDeviceConfig = async () => {
    setLoading(true);
    try {
      const config = await DeviceConfigService.getDeviceTypeByName(deviceType);
      setDeviceConfig(config);
    } catch (error) {
      console.error('Error loading device config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    onSpecsChange({ ...specs, [fieldName]: value });
  };

  const renderField = (field: any) => {
    // Safe value extraction - FIXED
    const value = specs && specs[field.name] !== undefined && specs[field.name] !== null
      ? specs[field.name]
      : (field.defaultValue || '');

    // Skip rendering if field is invalid
    if (!field || !field.id || !field.type) {
      return null;
    }

    switch (field.type) {
      case 'text':
        return (
          <View key={field.id} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {field.label || ''}
              {field.required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <TextInput
              style={styles.fieldInput}
              placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || ''}`}
              value={String(value)}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              placeholderTextColor="#94A3B8"
            />
          </View>
        );

      case 'number':
        return (
          <View key={field.id} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {field.label || ''}
              {field.required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <TextInput
              style={styles.fieldInput}
              placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || ''}`}
              value={String(value)}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>
        );

      case 'textarea':
        return (
          <View key={field.id} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {field.label || ''}
              {field.required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || ''}`}
              value={String(value)}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
            />
          </View>
        );

      case 'select':
        return (
          <View key={field.id} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {field.label || ''}
              {field.required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => {
                setActiveField(field);
                setShowSelectModal(true);
              }}
            >
              <Text style={[styles.selectFieldText, !value && styles.selectFieldPlaceholder]}>
                {value || `Select ${field.label || ''}`}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        );

      case 'boolean':
        return (
          <View key={field.id} style={[styles.fieldGroup, styles.booleanField]}>
            <Text style={styles.fieldLabel}>{field.label || ''}</Text>
            <Switch
              value={Boolean(value)}
              onValueChange={(val) => handleFieldChange(field.name, val)}
              trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
              thumbColor="#fff"
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading specifications...</Text>
      </View>
    );
  }

  if (!deviceConfig) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>No configuration found for this device type</Text>
        <Text style={styles.errorSubtext}>Please contact your administrator</Text>
      </View>
    );
  }

  // Check if deviceConfig has fields
  const hasFields = deviceConfig.fields && deviceConfig.fields.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>{deviceConfig.icon || '🔧'}</Text>
          <Text style={styles.headerTitle}>
            {deviceConfig.name || 'Device'} Specifications
          </Text>
        </View>
        <Text style={styles.fieldCount}>
          {hasFields ? `${deviceConfig.fields.length} fields` : 'No fields'}
        </Text>
      </View>

      <ScrollView style={styles.fieldsContainer}>
        {hasFields ? (
          deviceConfig.fields.map(renderField)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No specifications available for this device</Text>
          </View>
        )}
      </ScrollView>

      {/* Select Field Modal */}
      <Modal
        visible={showSelectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSelectModal(false)}
      >
        <View style={styles.selectModalOverlay}>
          <View style={styles.selectModalContent}>
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>
                Select {activeField?.label || ''}
              </Text>
              <TouchableOpacity
                onPress={() => setShowSelectModal(false)}
                style={styles.selectModalClose}
              >
                <Ionicons name="close-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={activeField?.options || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectOption}
                  onPress={() => {
                    if (activeField) {
                      handleFieldChange(activeField.name, item.value);
                      setShowSelectModal(false);
                    }
                  }}
                >
                  <Text style={styles.selectOptionText}>{item.label}</Text>
                  {activeField && specs && specs[activeField.name] === item.value && (
                    <Ionicons name="checkmark-outline" size={20} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  fieldCount: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fieldsContainer: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  booleanField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  selectFieldText: {
    fontSize: 16,
    color: '#0F172A',
  },
  selectFieldPlaceholder: {
    color: '#94A3B8',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  selectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  selectModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    maxWidth: 400,
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  selectModalClose: {
    padding: 4,
  },
  selectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectOptionText: {
    fontSize: 16,
    color: '#0F172A',
  },
});