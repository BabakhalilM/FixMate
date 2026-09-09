// apps/technician-app/src/screens/ServicesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import ScreenWrapper from '@/components/ScreenWrapper';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/apicall';
import { DEVICE_TYPES } from '@/utils/data';
import { DeviceService } from '@/services';
import NewRepair from './NewRepair';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Service {
  id: string;
  name: string;
  icon: string;
  price: number;
  duration: string;
  active: boolean;
  description: string;
  totalRepairs: number;
  completedRepairs: number;
  pendingRepairs: number;
  averageRating: number;
}

export default function ServicesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration: '',
    description: '',
    deviceType: '',
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // Get technician's specialties from user profile
      const specialties = user?.profile?.specialties || [];
      
      // Get all repairs to calculate stats per device type
      const repairs = await DeviceService.getDevices();
      
      // Map device types to services with stats
      const serviceList = DEVICE_TYPES
        .filter(device => specialties.includes(device.id) || specialties.length === 0)
        .map(device => {
          const deviceRepairs = repairs.filter((r: any) => r.deviceType === device.id);
          const completedRepairs = deviceRepairs.filter((r: any) => r.status === 'completed');
          
          return {
            id: device.id,
            name: device.label,
            icon: device.icon || '🔧',
            price: 0, // This would come from your service pricing model
            duration: '1-2 hours', // This would come from your service model
            active: true,
            description: `${device.label} services`,
            totalRepairs: deviceRepairs.length,
            completedRepairs: completedRepairs.length,
            pendingRepairs: deviceRepairs.length - completedRepairs.length,
            averageRating: 0, // This would come from reviews
          };
        });

      setServices(serviceList);
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadServices();
  };

  const toggleService = (id: string) => {
    setServices(services.map(service =>
      service.id === id ? { ...service, active: !service.active } : service
    ));
    
    // TODO: Update technician's specialties in backend
    Alert.alert('Success', `Service ${services.find(s => s.id === id)?.active ? 'disabled' : 'enabled'} successfully`);
  };

  const navigateToServiceDetail = (serviceId: string) => {
    navigation.navigate('ServiceDetail', { serviceId });
  };

  const addService = () => {
    if (!newService.name || !newService.price || !newService.duration) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // Find device type
    const deviceType = DEVICE_TYPES.find(d => d.label === newService.name);
    
    const service: Service = {
      id: Date.now().toString(),
      name: newService.name,
      icon: deviceType?.icon || '🔧',
      price: parseFloat(newService.price),
      duration: newService.duration,
      active: true,
      description: newService.description || `${newService.name} services`,
      totalRepairs: 0,
      completedRepairs: 0,
      pendingRepairs: 0,
      averageRating: 0,
    };

    setServices([...services, service]);
    setShowAddModal(false);
    setNewService({ name: '', price: '', duration: '', description: '', deviceType: '' });
    
    // TODO: Add to technician's specialties in backend
    Alert.alert('Success', 'Service added successfully');
  };

  const renderServiceCard = (service: Service) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceCard}
      onPress={() => navigateToServiceDetail(service.id)}
      activeOpacity={0.7}
    >
      <View style={styles.serviceHeader}>
        <View style={styles.serviceIconContainer}>
          <Text style={styles.serviceIcon}>{service.icon}</Text>
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
        </View>
        <Switch
          value={service.active}
          onValueChange={() => toggleService(service.id)}
          trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
          thumbColor={service.active ? '#fff' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.serviceStats}>
        <View style={styles.statItem}>
          <Ionicons name="construct-outline" size={16} color="#6B7280" />
          <Text style={styles.statText}>{service.totalRepairs} Total</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
          <Text style={[styles.statText, styles.completedText]}>{service.completedRepairs} Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#D97706" />
          <Text style={[styles.statText, styles.pendingText]}>{service.pendingRepairs} Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star-outline" size={16} color="#F59E0B" />
          <Text style={styles.statText}>{service.averageRating.toFixed(1)} ★</Text>
        </View>
      </View>

      <View style={styles.serviceFooter}>
        <View style={styles.serviceDetail}>
          <Ionicons name="cash-outline" size={16} color="#6B7280" />
          <Text style={styles.serviceDetailText}>₹{service.price || '0'}</Text>
        </View>
        <View style={styles.serviceDetail}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.serviceDetailText}>{service.duration}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => navigateToServiceDetail(service.id)}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Services</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={28} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color="#4F46E5" />
            <Text style={styles.infoBannerText}>
              Tap on a service to view all repairs and details
            </Text>
          </View>

          <View style={styles.servicesContainer}>
            {services.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Services</Text>
                <Text style={styles.emptyText}>
                  Add your first service to get started
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={styles.emptyButtonText}>Add Service</Text>
                </TouchableOpacity>
              </View>
            ) : (
              services.map(renderServiceCard)
            )}
          </View>
        </ScrollView>

        {/* Add Service Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAddModal}
          onRequestClose={() => setShowAddModal(false)}
        >
          <NewRepair />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    margin: 16,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#4F46E5',
  },
  servicesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  serviceCard: {
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
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  serviceStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  completedText: {
    color: '#059669',
  },
  pendingText: {
    color: '#D97706',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 16,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  emptyState: {
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
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
});