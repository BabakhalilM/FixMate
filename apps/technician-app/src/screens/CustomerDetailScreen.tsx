// apps/technician-app/src/screens/CustomerDetailScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import ScreenWrapper from '@/components/ScreenWrapper';
import CustomerService, { Customer } from '@/services/CustomerService';
import { Repair } from '@/services/RepairService';
import { useRepairs } from '@/context/repairContext';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'CustomerDetail'>;

export default function CustomerDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { customerId } = route.params;

  const { repairs, refreshRepairs } = useRepairs();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await CustomerService.getCustomerById(customerId);
      setCustomer(data);
      await refreshRepairs();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomer(); }, [customerId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomer();
    setRefreshing(false);
  };

  // All repairs for this customer (unfiltered)
  const customerRepairs = useMemo(
    () =>
      repairs.filter(
        (r) =>
          r.customerId === customerId ||
          r.customerPhone === customer?.phone 
      ),
    [repairs, customerId, customer]
  );

  // Filtered by search query — recomputed on every keystroke
  const filteredRepairs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customerRepairs;

    return customerRepairs.filter((r) => {
      return (
        r.deviceType?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        r._id?.toLowerCase().includes(q) ||
        r.issueDescription?.toLowerCase().includes(q) ||
        r.charges?.toString().includes(q) ||
        new Date(r.createdAt).toLocaleDateString().toLowerCase().includes(q)
      );
    });
  }, [customerRepairs, searchQuery]);

  const navigateToRepairDetail = (repair: Repair) => {
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
        <View style={{ flex: 1 }}>
          <Text style={styles.repairDevice}>{item.deviceType}</Text>
          <Text style={styles.repairDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.repairStatus, { backgroundColor: getStatusBgColor(item.status) }]}>
          <Text style={[styles.repairStatusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.repairAmount}>₹{item.charges?.toLocaleString() || '0'}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
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
          <Text style={styles.headerTitle}>Customer Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Customer Info Card */}
        {customer && (
          <View style={styles.customerCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerPhone}>{customer.phone}</Text>
            {customer.email && <Text style={styles.customerEmail}>{customer.email}</Text>}
            {customer.address && <Text style={styles.customerAddress}>{customer.address}</Text>}
          </View>
        )}

        {/* Search box — only show when there are enough repairs to bother */}
        {customerRepairs.length > 5 && (
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search repairs (device, status, ID...)"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Repairs ({filteredRepairs.length}
          {searchQuery ? ` of ${customerRepairs.length}` : ''})
        </Text>

        <FlatList
          data={filteredRepairs}
          renderItem={renderRepairItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matching Repairs' : 'No Repairs Yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'This customer has no repair records'}
              </Text>
            </View>
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  customerCard: {
    backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  customerAvatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#4F46E5' },
  customerName: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  customerPhone: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  customerEmail: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  customerAddress: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },

  // New search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#1F2937',
  },

  sectionTitle: {
    fontSize: 16, fontWeight: '600', color: '#1F2937',
    marginHorizontal: 16, marginBottom: 8,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  repairCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  repairHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  repairDevice: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  repairDate: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  repairStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  repairStatusText: { fontSize: 11, fontWeight: '600' },
  repairAmount: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 12 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});