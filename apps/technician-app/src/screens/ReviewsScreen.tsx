import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import ScreenWrapper from '@/components/ScreenWrapper';
import { authApi } from '@/services/apicall';
import { useAuth } from '@/context/AuthContext';
import ReviewServices from '@/services/ReviewServices';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  serviceType: string;
  deviceType?: string;
  customerId?: string;
  technicianId?: string;
  repairId?: string;
}

export default function ReviewsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<number | null>(null);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {} as any,
  });

  // Load reviews on mount
  useEffect(() => {
    loadTechnicianReviews();
  }, []);

  // Get technician reviews
  const loadTechnicianReviews = async () => {
    try {
      setLoading(true);
      const technicianId = user?.id;
      if (!technicianId) {
        setReviews([]);
        return;
      }
      
      // Use authApi to get reviews
      const response = await ReviewServices.getTechnicianReviews(
        String(technicianId),
        filter !== null ? { rating: filter } : undefined,
      );
      
      if (response && response) {
        // Map API response to match your UI structure
        const mappedReviews = response.reviews.map((item: any) => ({
          id: item.id,
          customerName: item.customer?.name || 'Anonymous',
          rating: item.rating,
          comment: item.comment || '',
          date: new Date(item.createdAt).toLocaleDateString(),
          serviceType: item.deviceType || item.repair?.deviceType || 'General',
          deviceType: item.deviceType,
          customerId: item.customerId,
          technicianId: item.technicianId,
          repairId: item.repairId,
        }));
        
        setReviews(mappedReviews);
        
        // Set stats if available
        if (response.stats) {
          setStats({
            averageRating: response.stats.averageRating || 0,
            totalReviews: response.stats.totalReviews || mappedReviews.length,
            ratingDistribution: response.stats.ratingDistribution || {},
          });
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      // If API fails, you can keep the mock data for testing
      // Or show an empty state
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Get reviews for a specific device type
  const loadDeviceReviews = async (deviceType: string) => {
    try {
      const technicianId = user?.id;
      const response = await ReviewServices.getDeviceReviews(deviceType, {
        technicianId: technicianId ? String(technicianId) : undefined,
      });
      
      if (response && response) {
        const mappedReviews = response.reviews.map((item: any) => ({
          id: item.id,
          customerName: item.customer?.name || 'Anonymous',
          rating: item.rating,
          comment: item.comment || '',
          date: new Date(item.createdAt).toLocaleDateString(),
          serviceType: item.deviceType || item.repair?.deviceType || 'General',
        }));
        setReviews(mappedReviews);
      }
    } catch (error) {
      console.error('Error loading device reviews:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadTechnicianReviews();
  };

  // Calculate average rating (fallback if stats not available)
  const averageRating = stats.averageRating || 
    (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0);

  // Calculate rating distribution (fallback if stats not available)
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => r.rating === rating).length;
    return {
      rating,
      count,
      percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
    };
  });

  const filteredReviews = filter ? reviews.filter(r => r.rating === filter) : reviews;

  const renderStars = (rating: number) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={16}
          color={star <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </View>
  );

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.serviceType}>{item.serviceType}</Text>
        </View>
        <Text style={styles.reviewDate}>{item.date}</Text>
      </View>
      {renderStars(item.rating)}
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
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
          <Text style={styles.headerTitle}>Reviews</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Rating Summary */}
        <View style={styles.ratingSummary}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
            {renderStars(Math.round(averageRating))}
            <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
          </View>
          <View style={styles.ratingDistribution}>
            {ratingDistribution.map((item) => (
              <View key={item.rating} style={styles.distributionRow}>
                <Text style={styles.distributionLabel}>{item.rating}★</Text>
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionFill,
                      { width: `${item.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.distributionCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterButton, !filter && styles.filterButtonActive]}
            onPress={() => setFilter(null)}
          >
            <Text style={[styles.filterText, !filter && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {[5, 4, 3, 2, 1].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[styles.filterButton, filter === rating && styles.filterButtonActive]}
              onPress={() => setFilter(rating)}
            >
              <Text style={[styles.filterText, filter === rating && styles.filterTextActive]}>
                {rating}★
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reviews List */}
        <FlatList
          data={filteredReviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Reviews</Text>
              <Text style={styles.emptyText}>
                {filter ? `No ${filter}★ reviews yet` : 'No reviews yet'}
              </Text>
            </View>
          }
        />
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
  ratingSummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ratingLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  ratingDistribution: {
    flex: 1,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  distributionLabel: {
    fontSize: 12,
    color: '#6B7280',
    width: 30,
  },
  distributionBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  distributionCount: {
    fontSize: 12,
    color: '#6B7280',
    width: 20,
    textAlign: 'right',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceType: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewComment: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 8,
    lineHeight: 20,
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