// apps/technician-app/src/screens/RepairsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import ScreenWrapper from '@/components/ScreenWrapper';
// import { useRepairs } from '@/context/RepairContext';
import repairService, { Repair } from '@/services/RepairService';
import { useRepairs } from '@/context/repairContext';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const statusOptions = ['all', 'pending', 'in-progress', 'completed', 'cancelled'] as const;
type StatusType = typeof statusOptions[number];

export default function RepairsScreen() {
  const route = useRoute();
  const routeParams = route.params as { statusFilter?: string } | undefined;
  const initialStatus = routeParams?.statusFilter || 'all';
  const navigation = useNavigation<NavigationProp>();
  
  // Use RepairContext
  const { repairs, loading, refreshRepairs, updateRepair, deleteRepair } = useRepairs();
  
  const [filteredRepairs, setFilteredRepairs] = useState<Repair[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusType>(initialStatus as StatusType);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Apply filters whenever repairs, status, or search changes
  useEffect(() => {
    applyFilters(repairs, selectedStatus, searchQuery);
  }, [repairs, selectedStatus, searchQuery]);

  // Set initial status from route params
  useEffect(() => {
    if (initialStatus) {
      setSelectedStatus(initialStatus as StatusType);
    }
  }, [initialStatus]);

  // Refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      refreshRepairs();
    }, [refreshRepairs])
  );

  const applyFilters = (repairList: Repair[], status: StatusType, query: string) => {
    let filtered = [...repairList];
    
    if (status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(r =>
        r.customerName?.toLowerCase().includes(q) ||
        r.deviceType?.toLowerCase().includes(q) ||
        r.customerPhone?.includes(q)
      );
    }
    
    setFilteredRepairs(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // applyFilters will be called via useEffect
  };

  const handleStatusFilter = (status: StatusType) => {
    setSelectedStatus(status);
    setShowFilterModal(false);
    // applyFilters will be called via useEffect
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRepairs();
    setRefreshing(false);
  };

  const navigateToRepairDetail = (repair: Repair) => {
    console.log('Navigating to RepairDetail with ID:', repair._id);
    console.log('Repair object:', repair);
    navigation.navigate('RepairDetail', { repairId: repair._id });
  };

  const getStatusColor = (status: Repair['status']) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'pending': return '#D97706';
      case 'in-progress': return '#2563EB';
      case 'cancelled': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: Repair['status']) => {
    switch (status) {
      case 'completed': return '#D1FAE5';
      case 'pending': return '#FEF3C7';
      case 'in-progress': return '#DBEAFE';
      case 'cancelled': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  const renderRepairItem = ({ item }: { item: Repair }) => (
    <TouchableOpacity
      style={styles.repairCard}
      onPress={() => navigateToRepairDetail(item)}
    >
      <View style={styles.repairHeader}>
        <View>
          <Text style={styles.repairCustomer}>{item.customerName}</Text>
          <Text style={styles.repairDevice}>{item.deviceType}</Text>
        </View>
        <View style={[styles.repairStatus, { backgroundColor: getStatusBgColor(item.status) }]}>
          <Text style={[styles.repairStatusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.repairFooter}>
        <View style={styles.repairDateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.repairDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.repairAmount}>₹{item.charges?.toLocaleString() || '0'}</Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusCount = (status: StatusType) => {
    if (status === 'all') return repairs.length;
    return repairs.filter(r => r.status === status).length;
  };

  // Show loading state
  if (loading && repairs.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading repairs...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Repairs</Text>
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <Ionicons name="filter" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search repairs..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusTabs}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusTab, selectedStatus === status && styles.statusTabActive]}
              onPress={() => handleStatusFilter(status)}
            >
              <Text style={[styles.statusTabText, selectedStatus === status && styles.statusTabTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              <Text style={[styles.statusCount, selectedStatus === status && styles.statusCountActive]}>
                {getStatusCount(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredRepairs}
          renderItem={renderRepairItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Repairs Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try a different search term' : 'No repairs match the current filter'}
              </Text>
            </View>
          }
        />

        {/* Filter Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showFilterModal}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filter by Status</Text>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.modalOption, selectedStatus === status && styles.modalOptionActive]}
                  onPress={() => handleStatusFilter(status)}
                >
                  <Text style={[styles.modalOptionText, selectedStatus === status && styles.modalOptionTextActive]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                  <Text style={styles.modalOptionCount}>{getStatusCount(status)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  statusTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  statusTabActive: {
    backgroundColor: '#EEF2FF',
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusTabTextActive: {
    color: '#4F46E5',
  },
  statusCount: {
    fontSize: 10,
    color: '#9CA3AF',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  statusCountActive: {
    backgroundColor: '#C7D2FE',
    color: '#4F46E5',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  repairCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  repairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  repairCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  repairDevice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  repairStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  repairStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  repairFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  repairDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repairDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  repairAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalOptionActive: {
    backgroundColor: '#EEF2FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  modalOptionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
});