// apps/technician-app/src/screens/JobsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// import { StatusBadge } from '../components/StatusBadge';
import { ScrollView } from 'react-native-gesture-handler';
import { StatusBadge } from '@/components/StatusBadge';

const mockJobs = [
  {
    id: '1',
    customer: 'Priya Sharma',
    device: 'LG Split AC 1.5 Ton',
    issue: 'Not cooling properly',
    status: 'pending',
    date: '2024-01-15',
    time: '10:00 AM',
    location: 'Indiranagar, Bangalore',
    amount: 999,
  },
  {
    id: '2',
    customer: 'Rahul Verma',
    device: 'Samsung Refrigerator',
    issue: 'Cooling issue',
    status: 'accepted',
    date: '2024-01-15',
    time: '2:00 PM',
    location: 'Koramangala, Bangalore',
    amount: 1499,
  },
  {
    id: '3',
    customer: 'Ananya Patel',
    device: 'Whirlpool Washing Machine',
    issue: 'Not draining water',
    status: 'in-progress',
    date: '2024-01-14',
    time: '11:00 AM',
    location: 'HSR Layout, Bangalore',
    amount: 799,
  },
];

const tabs = ['All', 'Pending', 'Accepted', 'In Progress', 'Completed'];

export default function JobsScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = mockJobs.filter((job) => {
    const matchesTab = activeTab === 'All' || job.status === activeTab.toLowerCase();
    const matchesSearch = job.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.device.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const renderJob = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.jobCard}
    //   onPress={() => navigation.navigate('JobDetail' as never, { jobId: item.id })}
        onPress={() => navigation.navigate('JobDetail' as never )}
    >
      <View style={styles.jobHeader}>
        <View>
          <Text style={styles.jobDevice}>{item.device}</Text>
          <Text style={styles.jobCustomer}>{item.customer}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.jobIssue}>{item.issue}</Text>
      <View style={styles.jobFooter}>
        <Text style={styles.jobLocation}>📍 {item.location}</Text>
        <Text style={styles.jobTime}>🕐 {item.time}</Text>
        <Text style={styles.jobAmount}>₹{item.amount}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {}} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No jobs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    fontSize: 24,
    color: '#1a1a2e',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobDevice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  jobCustomer: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  jobIssue: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  jobLocation: {
    fontSize: 12,
    color: '#666',
  },
  jobTime: {
    fontSize: 12,
    color: '#666',
  },
  jobAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});