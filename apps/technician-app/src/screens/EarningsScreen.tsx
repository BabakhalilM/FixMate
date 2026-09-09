// src/screens/EarningsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import ScreenWrapper from '@/components/ScreenWrapper';
import { useRepairs } from '@/context/repairContext';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  todayEarnings: number;
  totalRepairs: number;
  monthlyRepairs: number;
  weeklyRepairs: number;
  todayRepairs: number;
  averageCharge: number;
  highestEarning: number;
  lowestEarning: number;
}

interface MonthlyData {
  month: string;
  earnings: number;
  repairs: number;
}

export default function EarningsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { repairs, loading: contextLoading, refreshRepairs } = useRepairs();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0,
    todayEarnings: 0,
    totalRepairs: 0,
    monthlyRepairs: 0,
    weeklyRepairs: 0,
    todayRepairs: 0,
    averageCharge: 0,
    highestEarning: 0,
    lowestEarning: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useFocusEffect(
    React.useCallback(() => {
      calculateEarnings();
    }, [repairs])
  );

  const calculateEarnings = () => {
    try {
      setLoading(true);
      
      // Filter completed repairs
      const completedRepairs = repairs.filter(r => r.status === 'completed');
      
      if (completedRepairs.length === 0) {
        setEarningsData({
          totalEarnings: 0,
          monthlyEarnings: 0,
          weeklyEarnings: 0,
          todayEarnings: 0,
          totalRepairs: 0,
          monthlyRepairs: 0,
          weeklyRepairs: 0,
          todayRepairs: 0,
          averageCharge: 0,
          highestEarning: 0,
          lowestEarning: 0,
        });
        setMonthlyData([]);
        setRecentTransactions([]);
        setLoading(false);
        return;
      }

      // Calculate earnings
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayRepairs = completedRepairs.filter(r => 
        new Date(r.completedAt || r.createdAt) >= today
      );
      const weekRepairs = completedRepairs.filter(r => 
        new Date(r.completedAt || r.createdAt) >= weekStart
      );
      const monthRepairs = completedRepairs.filter(r => 
        new Date(r.completedAt || r.createdAt) >= monthStart
      );

      const todayEarnings = todayRepairs.reduce((sum, r) => sum + (r.charges || 0), 0);
      const weekEarnings = weekRepairs.reduce((sum, r) => sum + (r.charges || 0), 0);
      const monthEarnings = monthRepairs.reduce((sum, r) => sum + (r.charges || 0), 0);
      const totalEarnings = completedRepairs.reduce((sum, r) => sum + (r.charges || 0), 0);

      const charges = completedRepairs.map(r => r.charges || 0);
      const averageCharge = charges.length > 0 
        ? charges.reduce((a, b) => a + b, 0) / charges.length 
        : 0;

      setEarningsData({
        totalEarnings,
        monthlyEarnings: monthEarnings,
        weeklyEarnings: weekEarnings,
        todayEarnings,
        totalRepairs: completedRepairs.length,
        monthlyRepairs: monthRepairs.length,
        weeklyRepairs: weekRepairs.length,
        todayRepairs: todayRepairs.length,
        averageCharge,
        highestEarning: charges.length > 0 ? Math.max(...charges) : 0,
        lowestEarning: charges.length > 0 ? Math.min(...charges) : 0,
      });

      // Calculate monthly data for chart
      const monthlyMap = new Map<string, { earnings: number; repairs: number }>();
      completedRepairs.forEach(r => {
        const date = new Date(r.completedAt || r.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyMap.get(key) || { earnings: 0, repairs: 0 };
        monthlyMap.set(key, {
          earnings: existing.earnings + (r.charges || 0),
          repairs: existing.repairs + 1,
        });
      });

      const sortedMonths = Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6);

      setMonthlyData(sortedMonths.map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        earnings: data.earnings,
        repairs: data.repairs,
      })));

      // Get recent transactions (completed repairs only)
      const sortedRepairs = [...completedRepairs].sort(
        (a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
      );
      
      setRecentTransactions(sortedRepairs.slice(0, 10));

    } catch (error) {
      console.error('Error calculating earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRepairs();
    calculateEarnings();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
    }
  };

  const getPeriodEarnings = () => {
    switch (selectedPeriod) {
      case 'week': return earningsData.weeklyEarnings;
      case 'month': return earningsData.monthlyEarnings;
      case 'year': return earningsData.totalEarnings;
    }
  };

  const getPeriodRepairs = () => {
    switch (selectedPeriod) {
      case 'week': return earningsData.weeklyRepairs;
      case 'month': return earningsData.monthlyRepairs;
      case 'year': return earningsData.totalRepairs;
    }
  };

  const renderBarChart = () => {
    if (monthlyData.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Earnings Overview</Text>
          <View style={styles.emptyChartContainer}>
            <Text style={styles.emptyChartText}>No data available</Text>
          </View>
        </View>
      );
    }

    const maxEarnings = Math.max(...monthlyData.map(d => d.earnings), 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Earnings Overview</Text>
        <View style={styles.chartBars}>
          {monthlyData.map((data, index) => (
            <View key={index} style={styles.chartBarWrapper}>
              <View style={styles.chartBarContainer}>
                <View 
                  style={[
                    styles.chartBar,
                    { 
                      height: (data.earnings / maxEarnings) * 120,
                      backgroundColor: index === monthlyData.length - 1 ? '#4F46E5' : '#818CF8'
                    }
                  ]} 
                />
                <Text style={styles.chartBarValue}>
                  {formatCurrency(data.earnings)}
                </Text>
              </View>
              <Text style={styles.chartBarLabel}>{data.month}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading || contextLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading earnings data...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Total Earnings Card */}
        <View style={styles.totalEarningsCard}>
          <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
          <Text style={styles.totalEarningsAmount}>
            {formatCurrency(earningsData.totalEarnings)}
          </Text>
          <Text style={styles.totalEarningsSubtext}>
            From {earningsData.totalRepairs} completed repairs
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period Earnings Card */}
        <View style={styles.periodEarningsCard}>
          <View style={styles.periodEarningsHeader}>
            <Text style={styles.periodEarningsLabel}>{getPeriodLabel()}</Text>
            <View style={styles.periodEarningsBadge}>
              <Text style={styles.periodEarningsBadgeText}>
                {getPeriodRepairs()} repairs
              </Text>
            </View>
          </View>
          <Text style={styles.periodEarningsAmount}>
            {formatCurrency(getPeriodEarnings())}
          </Text>
          <View style={styles.periodEarningsFooter}>
            <View style={styles.periodEarningsStat}>
              <Text style={styles.periodEarningsStatLabel}>Average</Text>
              <Text style={styles.periodEarningsStatValue}>
                {formatCurrency(earningsData.averageCharge)}
              </Text>
            </View>
            <View style={styles.periodEarningsStat}>
              <Text style={styles.periodEarningsStatLabel}>Highest</Text>
              <Text style={[styles.periodEarningsStatValue, styles.highestValue]}>
                {formatCurrency(earningsData.highestEarning)}
              </Text>
            </View>
            <View style={styles.periodEarningsStat}>
              <Text style={styles.periodEarningsStatLabel}>Lowest</Text>
              <Text style={[styles.periodEarningsStatValue, styles.lowestValue]}>
                {formatCurrency(earningsData.lowestEarning)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatCard}>
            <View style={[styles.quickStatIcon, styles.iconGreen]}>
              <Ionicons name="today-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.quickStatValue}>{formatCurrency(earningsData.todayEarnings)}</Text>
            <Text style={styles.quickStatLabel}>Today</Text>
          </View>
          <View style={styles.quickStatCard}>
            <View style={[styles.quickStatIcon, styles.iconBlue]}>
              <Ionicons name="calendar-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.quickStatValue}>{formatCurrency(earningsData.weeklyEarnings)}</Text>
            <Text style={styles.quickStatLabel}>This Week</Text>
          </View>
          <View style={styles.quickStatCard}>
            <View style={[styles.quickStatIcon, styles.iconPurple]}>
              <Ionicons name="calendar" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.quickStatValue}>{formatCurrency(earningsData.monthlyEarnings)}</Text>
            <Text style={styles.quickStatLabel}>This Month</Text>
          </View>
        </View>

        {/* Chart */}
        {renderBarChart()}

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Text style={styles.sectionSubtitle}>
              {recentTransactions.length} completed repairs
            </Text>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Transactions</Text>
              <Text style={styles.emptyText}>
                Complete repairs to start earning
              </Text>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionCard}
                onPress={() => navigation.navigate('RepairDetail', { repairId: transaction.id })}
              >
                <View style={styles.transactionIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#059669" />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionCustomer}>{transaction.customerName}</Text>
                  <Text style={styles.transactionDevice}>{transaction.deviceType}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.completedAt || transaction.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text style={styles.transactionAmount}>
                    +{formatCurrency(transaction.charges || 0)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Repairs</Text>
              <Text style={styles.summaryValue}>{earningsData.totalRepairs}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Average Charge</Text>
              <Text style={styles.summaryValue}>{formatCurrency(earningsData.averageCharge)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Highest Earning</Text>
              <Text style={[styles.summaryValue, styles.highestValue]}>{formatCurrency(earningsData.highestEarning)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Lowest Earning</Text>
              <Text style={[styles.summaryValue, styles.lowestValue]}>{formatCurrency(earningsData.lowestEarning)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>
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
  headerRight: {
    width: 32,
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
  totalEarningsCard: {
    backgroundColor: '#4F46E5',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  totalEarningsLabel: {
    fontSize: 14,
    color: '#C7D2FE',
    fontWeight: '500',
  },
  totalEarningsAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  totalEarningsSubtext: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  periodButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  periodEarningsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodEarningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodEarningsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  periodEarningsBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodEarningsBadgeText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  periodEarningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  periodEarningsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  periodEarningsStat: {
    alignItems: 'center',
  },
  periodEarningsStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  periodEarningsStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  highestValue: {
    color: '#059669',
  },
  lowestValue: {
    color: '#DC2626',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconGreen: {
    backgroundColor: '#ECFDF5',
  },
  iconBlue: {
    backgroundColor: '#EFF6FF',
  },
  iconPurple: {
    backgroundColor: '#EEF2FF',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarContainer: {
    alignItems: 'center',
  },
  chartBar: {
    width: 28,
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarValue: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyChartContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  transactionsSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCustomer: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionDevice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  summarySection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  footerSpacing: {
    height: 40,
  },
});