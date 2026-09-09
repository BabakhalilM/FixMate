// apps/technician-app/src/screens/DeviceTypeManager.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
// import Icon from "react-native-vector-icons/Ionicons";
import { Ionicons } from "@expo/vector-icons";
import { DeviceConfigService } from "../services/DeviceConfigService";

interface FieldOption {
  id: string;
  label: string;
  value: string;
}

interface DeviceField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "boolean";
  required: boolean;
  placeholder?: string;
  options?: FieldOption[];
  defaultValue?: any;
  section?: string;
}

interface DeviceType {
  id: string;
  name: string;
  icon: string;
  fields: DeviceField[];
  isActive: boolean;
  createdAt: string;
}

export default function DeviceTypeManager() {
  const navigation = useNavigation();
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<DeviceType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "🔧",
    fields: [] as DeviceField[],
  });
  const [fieldForm, setFieldForm] = useState<DeviceField>({
    id: "",
    name: "",
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    options: [],
  });
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<DeviceField | null>(null);

  useEffect(() => {
    loadDeviceTypes();
  }, []);

  const loadDeviceTypes = async () => {
    try {
      const types = await DeviceConfigService.getDeviceTypes();
      setDeviceTypes(types);
    } catch (error) {
      console.error("Error loading device types:", error);
    }
  };

  const handleSaveDeviceType = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter a device type name");
      return;
    }

    if (formData.fields.length === 0) {
      Alert.alert("Error", "Please add at least one field");
      return;
    }

    const newType: DeviceType = {
      id: editingType?.id || Date.now().toString(),
      name: formData.name,
      icon: formData.icon || "🔧",
      fields: formData.fields,
      isActive: true,
      createdAt: editingType?.createdAt || new Date().toISOString(),
    };

    try {
      await DeviceConfigService.saveDeviceType(newType);
      await loadDeviceTypes();
      setShowModal(false);
      resetForm();
      Alert.alert("Success", "Device type saved successfully!");
    } catch (error) {
      console.error("Error saving device type:", error);
      Alert.alert("Error", "Failed to save device type");
    }
  };

  const handleDeleteDeviceType = async (id: string) => {
    Alert.alert(
      "Delete Device Type",
      "This will remove the device type and all its configurations. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await DeviceConfigService.deleteDeviceType(id);
              await loadDeviceTypes();
            } catch (error) {
              console.error("Error deleting device type:", error);
              Alert.alert("Error", "Failed to delete device type");
            }
          },
        },
      ],
    );
  };

  const resetForm = () => {
    setFormData({ name: "", icon: "🔧", fields: [] });
    setEditingType(null);
  };

  const handleEditType = (type: DeviceType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      icon: type.icon,
      fields: [...type.fields],
    });
    setShowModal(true);
  };

  const handleAddField = () => {
    setFieldForm({
      id: Date.now().toString(),
      name: "",
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      options: [],
    });
    setEditingField(null);
    setShowFieldModal(true);
  };

  const handleEditField = (field: DeviceField) => {
    setEditingField(field);
    setFieldForm({ ...field });
    setShowFieldModal(true);
  };

  const handleSaveField = () => {
    if (!fieldForm.name.trim() || !fieldForm.label.trim()) {
      Alert.alert("Error", "Please fill in all required field properties");
      return;
    }

    if (
      fieldForm.type === "select" &&
      (!fieldForm.options || fieldForm.options.length === 0)
    ) {
      Alert.alert("Error", "Please add at least one option for select field");
      return;
    }

    let updatedFields: DeviceField[];
    if (editingField) {
      updatedFields = formData.fields.map((f) =>
        f.id === editingField.id ? fieldForm : f,
      );
    } else {
      updatedFields = [
        ...formData.fields,
        { ...fieldForm, id: Date.now().toString() },
      ];
    }

    setFormData({ ...formData, fields: updatedFields });
    setShowFieldModal(false);
  };

  const handleDeleteField = (fieldId: string) => {
    Alert.alert("Remove Field", "Are you sure you want to remove this field?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setFormData({
            ...formData,
            fields: formData.fields.filter((f) => f.id !== fieldId),
          });
        },
      },
    ]);
  };

  const handleAddOption = () => {
    const optionInput = prompt("Enter option value:");
    if (optionInput && optionInput.trim()) {
      setFieldForm({
        ...fieldForm,
        options: [
          ...(fieldForm.options || []),
          {
            id: Date.now().toString(),
            label: optionInput.trim(),
            value: optionInput.trim(),
          },
        ],
      });
    }
  };

  const handleRemoveOption = (optionId: string) => {
    setFieldForm({
      ...fieldForm,
      options: (fieldForm.options || []).filter((o) => o.id !== optionId),
    });
  };

  const renderFieldItem = (field: DeviceField) => (
    <View key={field.id} style={styles.fieldItem}>
      <View style={styles.fieldInfo}>
        <Text style={styles.fieldName}>{field.label}</Text>
        <View style={styles.fieldTags}>
          <Text style={styles.fieldTag}>{field.type}</Text>
          {field.required && (
            <Text style={[styles.fieldTag, styles.fieldTagRequired]}>
              Required
            </Text>
          )}
        </View>
      </View>
      <View style={styles.fieldActions}>
        <TouchableOpacity
          onPress={() => handleEditField(field)}
          style={styles.fieldActionBtn}
        >
          <Ionicons name="pencil-outline" size={18} color="#4F46E5" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteField(field.id)}
          style={styles.fieldActionBtn}
        >
          <Ionicons name="close-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDeviceTypeCard = (type: DeviceType) => (
    <View key={type.id} style={styles.deviceTypeCard}>
      <View style={styles.deviceTypeHeader}>
        <View style={styles.deviceTypeInfo}>
          <Text style={styles.deviceTypeIcon}>{type.icon}</Text>
          <View>
            <Text style={styles.deviceTypeName}>{type.name}</Text>
            <Text style={styles.deviceTypeFields}>
              {type.fields.length} fields
            </Text>
          </View>
        </View>
        <View style={styles.deviceTypeActions}>
          <TouchableOpacity
            onPress={() => handleEditType(type)}
            style={styles.deviceTypeActionBtn}
          >
            <Ionicons name="pencil-outline" size={20} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteDeviceType(type.id)}
            style={styles.deviceTypeActionBtn}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.deviceTypeFields}>
        {type.fields.slice(0, 3).map((field) => (
          <View key={field.id} style={styles.fieldPreview}>
            <Text style={styles.fieldPreviewText}>{field.label}</Text>
          </View>
        ))}
        {type.fields.length > 3 && (
          <View style={styles.fieldPreview}>
            <Text style={styles.fieldPreviewText}>
              +{type.fields.length - 3} more
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device Type Manager</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
          style={styles.addBtn}
        >
          <Ionicons name="add-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Device Configuration</Text>
          <Text style={styles.infoText}>
            Define device types and their specifications. Each device type can
            have custom fields that will appear when creating a new repair job.
          </Text>
        </View>

        {deviceTypes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>No Device Types</Text>
            <Text style={styles.emptyText}>
              Create your first device type to start managing repairs
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Text style={styles.createBtnText}>Create Device Type</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.deviceTypesList}>
            {deviceTypes.map(renderDeviceTypeCard)}
          </View>
        )}
      </ScrollView>

      {/* Device Type Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingType ? "Edit Device Type" : "Create Device Type"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Device Type Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Motor, AC, Refrigerator"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Icon</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., ⚡, ❄️, 🔧"
                  value={formData.icon}
                  onChangeText={(text) =>
                    setFormData({ ...formData, icon: text })
                  }
                />
              </View>

              <View style={styles.fieldsSection}>
                <View style={styles.fieldsHeader}>
                  <Text style={styles.fieldsTitle}>Custom Fields</Text>
                  <TouchableOpacity
                    onPress={handleAddField}
                    style={styles.addFieldBtn}
                  >
                    <Ionicons name="add-outline" size={20} color="#4F46E5" />
                    <Text style={styles.addFieldBtnText}>Add Field</Text>
                  </TouchableOpacity>
                </View>

                {formData.fields.length === 0 ? (
                  <View style={styles.noFields}>
                    <Text style={styles.noFieldsText}>
                      No fields added. Click "Add Field" to define
                      specifications.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.fieldsList}>
                    {formData.fields.map(renderFieldItem)}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveDeviceType}
              >
                <Text style={styles.saveBtnText}>
                  {editingType ? "Update Device Type" : "Create Device Type"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Field Configuration Modal */}
      <Modal
        visible={showFieldModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFieldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.fieldModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingField ? "Edit Field" : "Add Field"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowFieldModal(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Field Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., rpm, voltage, capacity"
                  value={fieldForm.name}
                  onChangeText={(text) =>
                    setFieldForm({ ...fieldForm, name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Field Label *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., RPM, Voltage, Capacity"
                  value={fieldForm.label}
                  onChangeText={(text) =>
                    setFieldForm({ ...fieldForm, label: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Field Type *</Text>
                <View style={styles.typeSelector}>
                  {["text", "number", "select", "textarea", "boolean"].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeOption,
                          fieldForm.type === type && styles.typeOptionActive,
                        ]}
                        onPress={() =>
                          setFieldForm({ ...fieldForm, type: type as any })
                        }
                      >
                        <Text
                          style={[
                            styles.typeOptionText,
                            fieldForm.type === type &&
                              styles.typeOptionTextActive,
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Placeholder</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Enter value..."
                  value={fieldForm.placeholder}
                  onChangeText={(text) =>
                    setFieldForm({ ...fieldForm, placeholder: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Required Field</Text>
                  <Switch
                    value={fieldForm.required}
                    onValueChange={(value) =>
                      setFieldForm({ ...fieldForm, required: value })
                    }
                    trackColor={{ false: "#CBD5E1", true: "#4F46E5" }}
                  />
                </View>
              </View>

              {fieldForm.type === "select" && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Options</Text>
                  <View style={styles.optionsContainer}>
                    {(fieldForm.options || []).map((option) => (
                      <View key={option.id} style={styles.optionItem}>
                        <Text style={styles.optionText}>{option.label}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveOption(option.id)}
                          style={styles.removeOptionBtn}
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={18}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addOptionBtn}
                      onPress={handleAddOption}
                    >
                      <Ionicons name="add-outline" size={20} color="#4F46E5" />
                      <Text style={styles.addOptionBtnText}>Add Option</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveField}
              >
                <Text style={styles.saveBtnText}>
                  {editingField ? "Update Field" : "Add Field"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#4F46E5",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  addBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  deviceTypesList: {
    gap: 12,
  },
  deviceTypeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  deviceTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  deviceTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deviceTypeIcon: {
    fontSize: 32,
  },
  deviceTypeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  deviceTypeFields: {
    fontSize: 12,
    color: "#64748B",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  deviceTypeActions: {
    flexDirection: "row",
    gap: 8,
  },
  deviceTypeActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  fieldPreview: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fieldPreviewText: {
    fontSize: 12,
    color: "#64748B",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: Platform.OS === "web" ? 600 : "100%",
    maxHeight: "90%",
  },
  fieldModalContent: {
    width: Platform.OS === "web" ? 500 : "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  fieldsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  fieldsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  fieldsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  addFieldBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addFieldBtnText: {
    color: "#4F46E5",
    fontWeight: "500",
  },
  fieldsList: {
    gap: 8,
  },
  fieldItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  fieldTags: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  fieldTag: {
    fontSize: 11,
    color: "#64748B",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fieldTagRequired: {
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
  },
  fieldActions: {
    flexDirection: "row",
    gap: 8,
  },
  fieldActionBtn: {
    padding: 4,
  },
  noFields: {
    padding: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  noFieldsText: {
    textAlign: "center",
    color: "#94A3B8",
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typeOptionActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  typeOptionText: {
    fontSize: 12,
    color: "#64748B",
  },
  typeOptionTextActive: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionText: {
    fontSize: 14,
    color: "#0F172A",
  },
  removeOptionBtn: {
    padding: 4,
  },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: "#4F46E5",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addOptionBtnText: {
    color: "#4F46E5",
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
