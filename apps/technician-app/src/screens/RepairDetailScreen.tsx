// apps/technician-app/src/screens/RepairDetailScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/navigation/types";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useRepairs } from "@/context/repairContext";
import repairService from "@/services/RepairService";
import { DEVICE_TYPES } from "@/utils/data";

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteParams = {
  RepairDetail: { repairId: string };
};

// Device spec field configuration
const DEVICE_SPEC_CONFIG: Record<
  string,
  { label: string; key: string; unit?: string }[]
> = {
  motor: [
    { label: "Motor Type", key: "motorType" },
    { label: "RPM", key: "rpm", unit: "RPM" },
    { label: "Voltage", key: "voltage", unit: "V" },
    { label: "Amps", key: "amps", unit: "A" },
    { label: "HP", key: "hp" },
    { label: "Phase", key: "phase" },
    { label: "Frequency", key: "frequency", unit: "Hz" },
  ],
  ac: [
    { label: "AC Type", key: "acType" },
    { label: "Tonnage", key: "tonnage", unit: "Ton" },
    { label: "Compressor", key: "compressor" },
    { label: "Refrigerant", key: "refrigerant" },
    { label: "Capacity", key: "capacity", unit: "BTU" },
    { label: "Inverter", key: "inverter" },
  ],
  refrigerator: [
    { label: "Refrigerator Type", key: "refrigeratorType" },
    { label: "Capacity", key: "capacity", unit: "L" },
    { label: "Compressor", key: "compressor" },
    { label: "Refrigerant", key: "refrigerant" },
    { label: "Defrost", key: "defrost" },
  ],
  washing_machine: [
    { label: "Washing Type", key: "washingType" },
    { label: "Capacity", key: "capacity", unit: "kg" },
    { label: "Motor Type", key: "motorType" },
    { label: "Spin Speed", key: "spinSpeed", unit: "RPM" },
    { label: "Heater", key: "heater" },
  ],
  water_pump: [
    { label: "Pump Type", key: "pumpType" },
    { label: "Power", key: "power", unit: "HP" },
    { label: "Flow Rate", key: "flowRate", unit: "L/min" },
    { label: "Voltage", key: "voltage", unit: "V" },
    { label: "Phase", key: "phase" },
  ],
  fan: [
    { label: "Fan Type", key: "fanType" },
    { label: "Speed", key: "speed" },
    { label: "Voltage", key: "voltage", unit: "V" },
    { label: "Power", key: "power", unit: "W" },
    { label: "Blades", key: "blades" },
  ],
  tv: [
    { label: "Screen Type", key: "screenType" },
    { label: "Screen Size", key: "screenSize", unit: "inches" },
    { label: "Resolution", key: "resolution" },
    { label: "Refresh Rate", key: "refreshRate", unit: "Hz" },
    { label: "Smart TV", key: "smartTV" },
  ],
  laptop: [
    { label: "Laptop Type", key: "laptopType" },
    { label: "Processor", key: "processor" },
    { label: "RAM", key: "ram", unit: "GB" },
    { label: "Storage", key: "storage", unit: "GB" },
    { label: "Screen Size", key: "screenSize", unit: "inches" },
    { label: "Battery", key: "battery" },
  ],
};

export default function RepairDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { repairId } = route.params as RouteParams["RepairDetail"];

  const { repairs, updateRepair, deleteRepair, getRepairById } = useRepairs();

  const [repair, setRepair] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editedData, setEditedData] = useState({
    customerName: "",
    customerPhone: "",
    deviceType: "",
    brand: "",
    model: "",
    serialNumber: "",
    problemDescription: "",
    charges: "",
    estimatedDays: "",
    notes: "",
    deviceSpecs: {} as Record<string, any>,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    loadRepairDetails();
  }, [repairId, repairs]);
  
  const loadRepairDetails = () => {
    setLoading(true);
    const repairData = getRepairById(repairId);
    
    console.log("repair details component repair",repairData);
    if (repairData) {
      setRepair(repairData);
      setSelectedStatus(repairData.status);
      setEditedData({
        customerName: repairData.customerName || "",
        customerPhone: repairData.customerPhone || "",
        deviceType: repairData.deviceType || "",
        brand: repairData.brand || "",
        model: repairData.model || "",
        serialNumber: repairData.serialNumber || "",
        problemDescription:
          repairData.problemDescription || repairData.issueDescription || "",
        charges: repairData.charges?.toString() || "",
        estimatedDays: repairData.estimatedDays || "",
        notes: repairData.notes || "",
        deviceSpecs: repairData.deviceSpecs || {},
      });
    } else {
      fetchRepairDirectly();
    }
    setLoading(false);
  };

  const fetchRepairDirectly = async () => {
    try {
      const data = await repairService.getRepairById(repairId);
      if (data) {
        setRepair(data);
        setSelectedStatus(data.status);
        setEditedData({
          customerName: data.customerName || "",
          customerPhone: data.customerPhone || "",
          deviceType: data.deviceType || "",
          brand: data.brand || "",
          model: data.model || "",
          serialNumber: data.serialNumber || "",
          problemDescription:
            data.problemDescription || data.issueDescription || "",
          charges: data.charges?.toString() || "",
          estimatedDays: data.estimatedDays || "",
          notes: data.notes || "",
          deviceSpecs: data.deviceSpecs || {},
        });
      }
    } catch (error) {
      console.error("Error fetching repair:", error);
      Alert.alert("Error", "Failed to load repair details");
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      setUpdating(true);
      const updated = await repairService.updateStatus(repairId, status as any);

      updateRepair(updated);

      setRepair(updated);
      setSelectedStatus(status);
      setShowStatusModal(false);

      Alert.alert("Success", `Repair status updated to ${status}`);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateRepair = async () => {
    if (!editedData.customerName.trim()) {
      Alert.alert("Error", "Customer name is required");
      return;
    }
    if (!editedData.deviceType.trim()) {
      Alert.alert("Error", "Device type is required");
      return;
    }
    if (!editedData.problemDescription.trim()) {
      Alert.alert("Error", "Problem description is required");
      return;
    }

    try {
      setUpdating(true);

      const updateData = {
        customerName: editedData.customerName,
        customerPhone: editedData.customerPhone,
        deviceType: editedData.deviceType,
        brand: editedData.brand,
        model: editedData.model,
        serialNumber: editedData.serialNumber,
        problemDescription: editedData.problemDescription,
        charges: parseFloat(editedData.charges) || 0,
        estimatedDays: editedData.estimatedDays,
        notes: editedData.notes,
        deviceSpecs: editedData.deviceSpecs,
      };

      const updated = await repairService.updateRepair(repairId, updateData);

      updateRepair(updated);

      setRepair(updated);
      setShowEditModal(false);

      Alert.alert("Success", "Repair updated successfully");
    } catch (error) {
      console.error("Error updating repair:", error);
      Alert.alert("Error", "Failed to update repair");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRepair = () => {
    Alert.alert(
      "Delete Repair",
      "Are you sure you want to delete this repair? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdating(true);
              await repairService.deleteRepair(repairId);
              deleteRepair(repairId);
              Alert.alert("Success", "Repair deleted successfully");
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting repair:", error);
              Alert.alert("Error", "Failed to delete repair");
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#059669";
      case "pending":
        return "#D97706";
      case "in-progress":
        return "#2563EB";
      case "cancelled":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#D1FAE5";
      case "pending":
        return "#FEF3C7";
      case "in-progress":
        return "#DBEAFE";
      case "cancelled":
        return "#FEE2E2";
      default:
        return "#F3F4F6";
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    const device = DEVICE_TYPES.find((d) => d.id === deviceType);
    return device?.icon || "🔧";
  };

  const getDeviceLabel = (deviceType: string) => {
    const device = DEVICE_TYPES.find((d) => d.id === deviceType);
    return device?.label || deviceType;
  };

  const renderDeviceSpecs = () => {
    if (!repair?.deviceSpecs || Object.keys(repair.deviceSpecs).length === 0) {
      return null;
    }

    const specs = repair.deviceSpecs;
    const deviceType = repair.deviceType;
    const config = DEVICE_SPEC_CONFIG[deviceType] || [];

    // If we have a config for this device type, use it to display specs in order
    if (config.length > 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Specifications</Text>
          {config.map((field) => {
            const value = specs[field.key];
            if (value === undefined || value === null || value === "")
              return null;
            return (
              <View key={field.key} style={styles.specRow}>
                <Text style={styles.specLabel}>{field.label}</Text>
                <Text style={styles.specValue}>
                  {typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : String(value)}
                  {field.unit && ` ${field.unit}`}
                </Text>
              </View>
            );
          })}
          {/* Show any additional specs not in config */}
          {Object.entries(specs).map(([key, value]) => {
            if (value === undefined || value === null || value === "")
              return null;
            const isInConfig = config.some((f) => f.key === key);
            if (isInConfig) return null;
            return (
              <View key={key} style={styles.specRow}>
                <Text style={styles.specLabel}>
                  {key.replace(/_/g, " ").toUpperCase()}
                </Text>
                <Text style={styles.specValue}>
                  {typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : String(value)}
                </Text>
              </View>
            );
          })}
        </View>
      );
    }

    // Fallback: Display all specs as key-value pairs
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Specifications</Text>
        {Object.entries(specs).map(([key, value]) => {
          if (value === undefined || value === null || value === "")
            return null;
          return (
            <View key={key} style={styles.specRow}>
              <Text style={styles.specLabel}>
                {key.replace(/_/g, " ").toUpperCase()}
              </Text>
              <Text style={styles.specValue}>
                {typeof value === "boolean"
                  ? value
                    ? "Yes"
                    : "No"
                  : String(value)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const statusOptions = [
    { value: "pending", label: "Pending", color: "#D97706" },
    { value: "in-progress", label: "In Progress", color: "#2563EB" },
    { value: "completed", label: "Completed", color: "#059669" },
    { value: "cancelled", label: "Cancelled", color: "#DC2626" },
  ];

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading repair details...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!repair) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
          <Text style={styles.errorTitle}>Repair Not Found</Text>
          <Text style={styles.errorText}>
            The repair you're looking for doesn't exist
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Repair Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowEditModal(true)}
              style={styles.headerAction}
            >
              <Ionicons name="pencil-outline" size={22} color="#4F46E5" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteRepair}
              style={styles.headerAction}
            >
              <Ionicons name="trash-outline" size={22} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Status Section */}
          <View style={styles.statusSection}>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(selectedStatus) },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(selectedStatus) },
                ]}
              >
                {selectedStatus.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changeStatusButton}
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={styles.changeStatusText}>Change Status</Text>
              <Ionicons name="chevron-down" size={20} color="#4F46E5" />
            </TouchableOpacity>
          </View>

          {/* Device Type Badge */}
          <View style={styles.deviceTypeBadge}>
            <Text style={styles.deviceTypeIcon}>
              {getDeviceIcon(repair.deviceType)}
            </Text>
            <Text style={styles.deviceTypeLabel}>
              {getDeviceLabel(repair.deviceType)}
            </Text>
            {repair.status === "completed" && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>✓ Completed</Text>
              </View>
            )}
          </View>

          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{repair.customerName}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{repair.customerPhone}</Text>
              </View>
            </View>
            {repair.customerId && (
              <TouchableOpacity
                style={styles.viewCustomerButton}
                onPress={() =>
                  navigation.navigate("CustomerDetail", {
                    customerId: repair.customerId,
                  })
                }
              >
                <Text style={styles.viewCustomerText}>
                  View Customer Profile
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
              </TouchableOpacity>
            )}
          </View>

          {/* Device Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Information</Text>
            <View style={styles.infoRow}>
              <Ionicons
                name="hardware-chip-outline"
                size={20}
                color="#6B7280"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Device Type</Text>
                <Text style={styles.infoValue}>
                  {getDeviceLabel(repair.deviceType)}
                </Text>
              </View>
            </View>
            {repair.brand && (
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Brand</Text>
                  <Text style={styles.infoValue}>{repair.brand}</Text>
                </View>
              </View>
            )}
            {repair.images?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Repair Images</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imagesContainer}
                >
                  {repair.images.map((image: any, index: number) => (
                    <Image
                      key={image._id || image.url || index}
                      source={{ uri: image.url }}
                      style={styles.repairImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}
            {repair.model && (
              <View style={styles.infoRow}>
                <Ionicons name="cube-outline" size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Model</Text>
                  <Text style={styles.infoValue}>{repair.model}</Text>
                </View>
              </View>
            )}
            {repair.serialNumber && (
              <View style={styles.infoRow}>
                <Ionicons name="barcode-outline" size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Serial Number</Text>
                  <Text style={styles.infoValue}>{repair.serialNumber}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Problem Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Problem Description</Text>
            <Text style={styles.descriptionText}>
              {repair.problemDescription ||
                repair.issueDescription ||
                "No description provided"}
            </Text>
          </View>

          {/* Device Specifications - Dynamic */}
          {renderDeviceSpecs()}

          {/* Repair Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Repair Details</Text>
            {repair.charges !== undefined && repair.charges !== null && (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Charges</Text>
                  <Text style={styles.infoValue}>
                    ₹{repair.charges.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            {repair.deposit !== undefined &&
              repair.deposit !== null &&
              repair.deposit > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="wallet-outline" size={20} color="#6B7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Deposit</Text>
                    <Text style={styles.infoValue}>
                      ₹{repair.deposit.toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            {repair.estimatedDays && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Estimated Days</Text>
                  <Text style={styles.infoValue}>{repair.estimatedDays}</Text>
                </View>
              </View>
            )}
            {repair.notes && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#6B7280"
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Notes</Text>
                  <Text style={styles.infoValue}>{repair.notes}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Technician Information */}
          {repair.technician && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technician</Text>
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color="#6B7280"
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Assigned To</Text>
                  <Text style={styles.infoValue}>{repair.technician.name}</Text>
                  {repair.technician.email && (
                    <Text style={styles.infoSubValue}>
                      {repair.technician.email}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(repair.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
            {repair.completedAt && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#059669"
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Completed</Text>
                  <Text style={styles.infoValue}>
                    {new Date(repair.completedAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="refresh-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>
                  {new Date(repair.updatedAt).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="pencil-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Edit Repair</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteRepair}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Delete Repair</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Status Change Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showStatusModal}
          onRequestClose={() => setShowStatusModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Status</Text>
                <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusOption,
                    selectedStatus === status.value &&
                      styles.statusOptionActive,
                  ]}
                  onPress={() => handleStatusUpdate(status.value)}
                  disabled={updating}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: status.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      selectedStatus === status.value &&
                        styles.statusOptionTextActive,
                    ]}
                  >
                    {status.label}
                  </Text>
                  {selectedStatus === status.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4F46E5"
                    />
                  )}
                </TouchableOpacity>
              ))}

              {updating && (
                <View style={styles.updatingContainer}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={styles.updatingText}>Updating status...</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Repair</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.editForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Customer Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter customer name"
                      value={editedData.customerName}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, customerName: text })
                      }
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter phone number"
                      value={editedData.customerPhone}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, customerPhone: text })
                      }
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Device Type *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter device type"
                      value={editedData.deviceType}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, deviceType: text })
                      }
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Brand</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter brand"
                      value={editedData.brand}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, brand: text })
                      }
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Model</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter model"
                      value={editedData.model}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, model: text })
                      }
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Serial Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter serial number"
                      value={editedData.serialNumber}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, serialNumber: text })
                      }
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Problem Description *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Describe the problem"
                      value={editedData.problemDescription}
                      onChangeText={(text) =>
                        setEditedData({
                          ...editedData,
                          problemDescription: text,
                        })
                      }
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Charges (₹)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter charges"
                      value={editedData.charges}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, charges: text })
                      }
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Estimated Days</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 2-3 days"
                      value={editedData.estimatedDays}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, estimatedDays: text })
                      }
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Add notes..."
                      value={editedData.notes}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, notes: text })
                      }
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleUpdateRepair}
                    disabled={updating}
                  >
                    {updating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F3F4F6",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  errorButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  errorButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  headerAction: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  changeStatusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeStatusText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
  },
  deviceTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 10,
  },
  deviceTypeIcon: {
    fontSize: 28,
  },
  deviceTypeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  completedBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    marginTop: 2,
  },
  infoSubValue: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 22,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  specLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  specValue: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
  },
  viewCustomerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    gap: 4,
  },
  viewCustomerText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#4F46E5",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  editModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 500,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusOptionActive: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  statusOptionTextActive: {
    color: "#4F46E5",
    fontWeight: "500",
  },
  updatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  updatingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  editForm: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imagesContainer: {
    gap: 12,
    paddingHorizontal: 16,
  },
  repairImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
});
