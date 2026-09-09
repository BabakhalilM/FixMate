// apps/technician-app/src/screens/TechnicianDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "@/context/AuthContext";
import ScreenWrapper from "@/components/ScreenWrapper";
import CustomerService from "@/services/CustomerService";
// import { useRepairs } from "@/context/RepairContext";
import { RootStackParamList } from "@/navigation/types";
import { useRepairs } from "@/context/repairContext";

export default function TechnicianDashboard() {
  type Navigation = StackNavigationProp<RootStackParamList, "TechnicianDashboard">;
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { 
    repairs, 
    dashboardStats, 
    loading, 
    refreshRepairs,
    totalCustomers,
    setTotalCustomers 
  } = useRepairs();

  const [recentRepairs, setRecentRepairs] = useState(repairs.slice(0, 5));

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      // Fetch customers count
      const customers = await CustomerService.getMyCustomers();
      setTotalCustomers(customers.length);
      
      // Refresh repairs
      await refreshRepairs();
      
      // Update recent repairs
      setRecentRepairs(repairs.slice(0, 5));
      
    } catch (error) {
      console.error("Error loading dashboard:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const navigateToCustomers = () => {
    navigation.navigate("Customers");
  };

  const navigateToRepairs = (statusFilter: string) => {
    navigation.navigate("Repairs", { statusFilter: statusFilter });
  };

  const navigateToNewRepair = () => {
    navigation.navigate("NewRepair", {});
  };

  const navigateToCustomerSearch = () => {
    navigation.navigate("CustomerSearch");
  };

  const navigateToProfile = () => {
    navigation.navigate("Profile");
  };

  const navigateToRepairDetail = (repairId: string) => {
    navigation.navigate("RepairDetail", { repairId });
  };

  const navigateToEarnings = () => {
    navigation.navigate("Earnings");
  };

  if (loading && repairs.length === 0) {
    return (
      <ScreenWrapper scrollable={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable={true}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.name || "Technician"} 👋
            </Text>
            <Text style={styles.subGreeting}>
              Welcome to your service dashboard
            </Text>
          </View>
          <TouchableOpacity onPress={navigateToProfile} style={styles.profileBtn}>
            <Ionicons name="person-circle-outline" size={44} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={navigateToCustomers}>
            <View style={[styles.statIconContainer, styles.iconPurple]}>
              <Ionicons name="people-outline" size={22} color="#4F46E5" />
            </View>
            <Text style={styles.statNumber}>{dashboardStats.totalCustomers}</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => navigateToRepairs("all")}>
            <View style={[styles.statIconContainer, styles.iconBlue]}>
              <Ionicons name="construct-outline" size={22} color="#2563EB" />
            </View>
            <Text style={[styles.statNumber, styles.statNumberBlue]}>
              {dashboardStats.totalRepairs}
            </Text>
            <Text style={styles.statLabel}>Total Repairs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => navigateToRepairs("pending")}>
            <View style={[styles.statIconContainer, styles.iconOrange]}>
              <Ionicons name="time-outline" size={22} color="#D97706" />
            </View>
            <Text style={[styles.statNumber, styles.statNumberOrange]}>
              {dashboardStats.pendingRepairs}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => navigateToRepairs("completed")}>
            <View style={[styles.statIconContainer, styles.iconGreen]}>
              <Ionicons name="checkmark-done-outline" size={22} color="#059669" />
            </View>
            <Text style={[styles.statNumber, styles.statNumberGreen]}>
              {dashboardStats.completedRepairs}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsLabel}>Monthly Earnings</Text>
              <Text style={styles.earningsAmount}>
                ₹{dashboardStats.monthlyEarnings.toLocaleString()}
              </Text>
            </View>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>
                Today: {dashboardStats.todayRepairs}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.earningsLink} onPress={navigateToEarnings}>
            <Text style={styles.earningsLinkText}>View Details →</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionPrimary]}
            onPress={navigateToNewRepair}
          >
            <Ionicons name="add-circle-outline" size={28} color="#fff" />
            <Text style={styles.actionText}>New Repair</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={navigateToCustomerSearch}
          >
            <Ionicons name="search-outline" size={28} color="#fff" />
            <Text style={styles.actionText}>Search Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Repairs */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Repairs</Text>
            <TouchableOpacity onPress={() => navigateToRepairs("all")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {repairs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Repairs Yet</Text>
              <Text style={styles.emptyText}>
                Start by adding a new repair job
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={navigateToNewRepair}>
                <Text style={styles.emptyButtonText}>Add New Repair</Text>
              </TouchableOpacity>
            </View>
          ) : (
            repairs.slice(0, 5).map((repair) => (
              <TouchableOpacity
                key={repair._id}
                style={styles.repairCard}
                onPress={() => navigateToRepairDetail(repair._id)}
              >
                <View style={styles.repairHeader}>
                  <View>
                    <Text style={styles.repairCustomer}>
                      {repair.customerName}
                    </Text>
                    <Text style={styles.repairDevice}>{repair.deviceType}</Text>
                  </View>
                  <View
                    style={[
                      styles.repairStatus,
                      repair.status === "completed" && styles.statusCompleted,
                      repair.status === "pending" && styles.statusPending,
                      repair.status === "in-progress" && styles.statusInProgress,
                      repair.status === "cancelled" && styles.statusCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.repairStatusText,
                        repair.status === "completed" && styles.statusTextCompleted,
                        repair.status === "pending" && styles.statusTextPending,
                        repair.status === "in-progress" && styles.statusTextInProgress,
                        repair.status === "cancelled" && styles.statusTextCancelled,
                      ]}
                    >
                      {repair.status? repair.status.toUpperCase():""}
                    </Text>
                  </View>
                </View>
                <View style={styles.repairFooter}>
                  <View style={styles.repairDateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.repairDate}>
                      {new Date(repair.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.repairAmount}>
                    ₹{repair.charges?.toLocaleString() || "0"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  subGreeting: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  profileBtn: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconPurple: {
    backgroundColor: "#EEF2FF",
  },
  iconBlue: {
    backgroundColor: "#EFF6FF",
  },
  iconOrange: {
    backgroundColor: "#FFFBEB",
  },
  iconGreen: {
    backgroundColor: "#ECFDF5",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  statNumberBlue: {
    color: "#2563EB",
  },
  statNumberOrange: {
    color: "#D97706",
  },
  statNumberGreen: {
    color: "#059669",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  earningsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earningsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  earningsLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 4,
  },
  todayBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayBadgeText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "500",
  },
  earningsLink: {
    marginTop: 12,
    alignSelf: "flex-end",
  },
  earningsLinkText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "500",
  },
  quickActions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
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
  actionPrimary: {
    backgroundColor: "#4F46E5",
  },
  actionSecondary: {
    backgroundColor: "#3B82F6",
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  recentSection: {
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
  seeAllText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "500",
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
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  repairStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: "#D1FAE5",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusInProgress: {
    backgroundColor: "#DBEAFE",
  },
  statusCancelled: {
    backgroundColor: "#FEE2E2",
  },
  repairStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusTextCompleted: {
    color: "#065F46",
  },
  statusTextPending: {
    color: "#92400E",
  },
  statusTextInProgress: {
    color: "#1E40AF",
  },
  statusTextCancelled: {
    color: "#991B1B",
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
  emptyButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});