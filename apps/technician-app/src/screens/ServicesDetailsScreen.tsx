// apps/technician-app/src/screens/ServiceDetailScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/navigation/types";
import ScreenWrapper from "@/components/ScreenWrapper";
// import { authApi } from "@/services/apicall";
import { DEVICE_TYPES } from "@/utils/data";
// import { RepairService } from "@/services/RepairService";
import ReviewServices from "@/services/ReviewServices";
import RepairService, { Repair } from "@/services/RepairService";

type Navigation = StackNavigationProp<RootStackParamList>;

// interface Repair {
//   _id: string;
//   customerName: string;
//   customerPhone: string;
//   deviceType: string;
//   brand?: string;
//   model?: string;
//   problemDescription: string;
//   status: "pending" | "in-progress" | "completed" | "cancelled";
//   charges: number;
//   estimatedDays?: string;
//   createdAt: string;
//   completedAt?: string;
// }

interface ServiceStats {
  totalRepairs: number;
  completedRepairs: number;
  pendingRepairs: number;
  inProgressRepairs: number;
  cancelledRepairs: number;
  totalEarnings: number;
  averageRating: number;
  averageCharges: number;
}

export default function ServiceDetailScreen() {
  const navigation = useNavigation<Navigation>();
  // const route = useRoute<ServiceDetailRoute>();
  const route = useRoute();
  const { serviceId } = route.params as { serviceId: string };

  const [service, setService] = useState<any>(null);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [filteredRepairs, setFilteredRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ServiceStats>({
    totalRepairs: 0,
    completedRepairs: 0,
    pendingRepairs: 0,
    inProgressRepairs: 0,
    cancelledRepairs: 0,
    totalEarnings: 0,
    averageRating: 0,
    averageCharges: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showReviews, setShowReviews] = useState(false);

  const statusOptions = [
    "all",
    "pending",
    "in-progress",
    "completed",
    "cancelled",
  ];

  useEffect(() => {
    loadServiceDetails();
  }, [serviceId]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);

      // Get service info
      const deviceType = DEVICE_TYPES.find((d) => d.id === serviceId);

      // Get all repairs for this service type
      const allRepairs = await RepairService.getRepairs();
      const repairList = Array.isArray(allRepairs)
        ? allRepairs
        : (allRepairs as any)?.repairs ?? [];
      const serviceRepairs = repairList.filter(
        (r: any) => r.deviceType === serviceId,
      );

      // Get reviews for this service type
      const reviews = await ReviewServices.getRepairReviews(serviceId);

      // Calculate stats
      const completed = serviceRepairs.filter(
        (r: any) => r.status === "completed",
      );
      const pending = serviceRepairs.filter((r: any) => r.status === "pending");
      const inProgress = serviceRepairs.filter(
        (r: any) => r.status === "in-progress",
      );
      const cancelled = serviceRepairs.filter(
        (r: any) => r.status === "cancelled",
      );

      const totalEarnings = completed.reduce(
        (sum: number, r: any) => sum + (r.charges || 0),
        0,
      );
      const avgCharges =
        completed.length > 0 ? totalEarnings / completed.length : 0;
      const avgRating = Array.isArray(reviews) && reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      setService({
        id: serviceId,
        name: deviceType?.label || serviceId,
        icon: deviceType?.icon || "🔧",
        description: `${deviceType?.label || serviceId} repair services`,
      });

      setRepairs(serviceRepairs);
      setFilteredRepairs(serviceRepairs);

      setStats({
        totalRepairs: serviceRepairs.length,
        completedRepairs: completed.length,
        pendingRepairs: pending.length,
        inProgressRepairs: inProgress.length,
        cancelledRepairs: cancelled.length,
        totalEarnings,
        averageRating: avgRating,
        averageCharges: avgCharges,
      });
    } catch (error) {
      console.error("Error loading service details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadServiceDetails();
  };

  const filterByStatus = (status: string) => {
    setSelectedStatus(status);
    if (status === "all") {
      setFilteredRepairs(repairs);
    } else {
      setFilteredRepairs(repairs.filter((r) => r.status === status));
    }
  };

  const navigateToRepairDetail = (repairId: string) => {
    navigation.navigate("RepairDetail", { repairId });
  };

  const navigateToNewRepair = () => {
    // Cast to any to satisfy typed navigation union for this route
    navigation.navigate("NewRepair" as any);
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

  const renderRepairItem = ({ item }: { item: Repair }) => (
    <TouchableOpacity
      style={styles.repairCard}
      onPress={() => navigateToRepairDetail(item._id)}
    >
      <View style={styles.repairHeader}>
        <View>
          <Text style={styles.repairCustomer}>{item.customerName}</Text>
          <Text style={styles.repairDevice}>
            {item.brand || ""} {item.model || ""}
          </Text>
        </View>
        <View
          style={[
            styles.repairStatus,
            { backgroundColor: getStatusBgColor(item.status) },
          ]}
        >
          <Text
            style={[
              styles.repairStatusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.repairBody}>
        <Text style={styles.repairProblem} numberOfLines={2}>
          {item.problemDescription}
        </Text>
      </View>
      <View style={styles.repairFooter}>
        <View style={styles.repairDateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.repairDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.repairAmount}>
          ₹{item.charges?.toLocaleString() || "0"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{service?.name || "Service"}</Text>
          <TouchableOpacity onPress={navigateToNewRepair}>
            <Ionicons name="add-circle" size={28} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Service Info */}
          <View style={styles.serviceInfoCard}>
            <View style={styles.serviceIconContainer}>
              <Text style={styles.serviceIcon}>{service?.icon || "🔧"}</Text>
            </View>
            <Text style={styles.serviceName}>{service?.name}</Text>
            <Text style={styles.serviceDescription}>
              {service?.description}
            </Text>

            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text style={styles.ratingLabel}>Average Rating</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalRepairs}</Text>
              <Text style={styles.statLabel}>Total Repairs</Text>
            </View>
            <View style={[styles.statCard, styles.statCompleted]}>
              <Text style={[styles.statNumber, styles.statNumberCompleted]}>
                {stats.completedRepairs}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, styles.statPending]}>
              <Text style={[styles.statNumber, styles.statNumberPending]}>
                {stats.pendingRepairs + stats.inProgressRepairs}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
          </View>

          {/* Earnings */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsLeft}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsAmount}>
                ₹{stats.totalEarnings.toLocaleString()}
              </Text>
            </View>
            <View style={styles.earningsRight}>
              <Text style={styles.earningsLabel}>Average Charge</Text>
              <Text style={styles.earningsAmount}>
                ₹{stats.averageCharges.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    selectedStatus === status && styles.filterButtonActive,
                  ]}
                  onPress={() => filterByStatus(status)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedStatus === status && styles.filterTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                  <Text
                    style={[
                      styles.filterCount,
                      selectedStatus === status && styles.filterCountActive,
                    ]}
                  >
                    {status === "all"
                      ? repairs.length
                      : repairs.filter((r) => r.status === status).length}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Repairs List */}
          <View style={styles.repairsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Repairs</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredRepairs.length}{" "}
                {filteredRepairs.length === 1 ? "repair" : "repairs"}
              </Text>
            </View>

            {filteredRepairs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="construct-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Repairs</Text>
                <Text style={styles.emptyText}>
                  {selectedStatus === "all"
                    ? "No repairs for this service yet"
                    : `No ${selectedStatus} repairs found`}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredRepairs}
                renderItem={renderRepairItem}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
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
  serviceInfoCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  serviceIcon: {
    fontSize: 40,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  ratingLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCompleted: {
    backgroundColor: "#ECFDF5",
  },
  statPending: {
    backgroundColor: "#FFFBEB",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  statNumberCompleted: {
    color: "#059669",
  },
  statNumberPending: {
    color: "#D97706",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  earningsCard: {
    flexDirection: "row",
    backgroundColor: "#4F46E5",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    justifyContent: "space-around",
  },
  earningsLeft: {
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.2)",
    paddingRight: 20,
    flex: 1,
  },
  earningsRight: {
    alignItems: "center",
    paddingLeft: 20,
    flex: 1,
  },
  earningsLabel: {
    fontSize: 12,
    color: "#C7D2FE",
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: "#4F46E5",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#fff",
  },
  filterCount: {
    fontSize: 10,
    color: "#9CA3AF",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterCountActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
  },
  repairsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  repairCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  repairHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  repairCustomer: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  repairDevice: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  repairStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  repairStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  repairBody: {
    marginTop: 8,
  },
  repairProblem: {
    fontSize: 14,
    color: "#4B5563",
  },
  repairFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  repairDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  repairDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  repairAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
});
