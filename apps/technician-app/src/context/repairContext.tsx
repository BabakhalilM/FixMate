// apps/technician-app/src/context/RepairContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import repairService, { Repair, RepairStats } from '@/services/RepairService';
import { Alert } from 'react-native';

// Dashboard specific stats
export interface DashboardStats {
  totalCustomers: number;
  totalRepairs: number;
  pendingRepairs: number;
  completedRepairs: number;
  monthlyEarnings: number;
  todayRepairs: number;
}

interface RepairContextType {
  repairs: Repair[];
  stats: RepairStats;
  dashboardStats: DashboardStats; // Added dashboard stats
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  loadRepairs: () => Promise<void>;
  addRepair: (repair: Repair) => void;
  updateRepair: (repair: Repair) => void;
  deleteRepair: (repairId: string) => void;
  getRepairById: (id: string) => Repair | undefined;
  clearRepairs: () => void;
  refreshRepairs: () => Promise<void>;
  totalCustomers: number; // Added for customer count
  setTotalCustomers: (count: number) => void; // To update customer count
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

export function RepairProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Calculate stats from repairs
  const calculateStats = useCallback((repairsList: Repair[]): RepairStats => {
    const total = repairsList.length;
    const pending = repairsList.filter(r => r.status === 'pending').length;
    const inProgress = repairsList.filter(r => r.status === 'in-progress').length;
    const completed = repairsList.filter(r => r.status === 'completed').length;
    const cancelled = repairsList.filter(r => r.status === 'cancelled').length;
    
    const totalEarnings = repairsList
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.charges || 0), 0);

    const statusDistribution = { pending, inProgress, completed, cancelled };
    const priorityDistribution = { low: 0, medium: 0, high: 0, urgent: 0 };
    
    repairsList.forEach(r => {
      if (r.priority) {
        priorityDistribution[r.priority] = (priorityDistribution[r.priority] || 0) + 1;
      }
    });

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      statusDistribution,
      priorityDistribution,
      earnings: {
        totalEarnings,
        averageCharge: completed > 0 ? totalEarnings / completed : 0,
        minCharge: completed > 0 ? Math.min(...repairsList.filter(r => r.status === 'completed').map(r => r.charges || 0)) : 0,
        maxCharge: completed > 0 ? Math.max(...repairsList.filter(r => r.status === 'completed').map(r => r.charges || 0)) : 0,
      }
    };
  }, []);

  // Calculate dashboard stats
  const calculateDashboardStats = useCallback((repairsList: Repair[]): DashboardStats => {
    const today = new Date().toDateString();
    const todayRepairs = repairsList.filter(
      (r) => new Date(r.createdAt).toDateString() === today
    );

    const completedRepairs = repairsList.filter(
      (r) => r.status === 'completed'
    );

    const totalEarnings = completedRepairs.reduce(
      (sum, r) => sum + (r.charges || 0),
      0
    );

    return {
      totalCustomers: totalCustomers,
      totalRepairs: repairsList.length,
      pendingRepairs: repairsList.filter(
        (r) => r.status === 'pending' || r.status === 'in-progress'
      ).length,
      completedRepairs: completedRepairs.length,
      monthlyEarnings: totalEarnings,
      todayRepairs: todayRepairs.length,
    };
  }, [totalCustomers]);

  // Load repairs from API
  const loadRepairs = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await repairService.getRepairs();
      const repairsList = response?.repairs || [];
      
      setRepairs(repairsList);
      setLastUpdated(new Date());
      
      console.log(`✅ Loaded ${repairsList.length} repairs`);
    } catch (error: any) {
      console.error('Error loading repairs:', error);
      setError(error.message || 'Failed to load repairs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh repairs (with loading indicator)
  const refreshRepairs = useCallback(async () => {
    await loadRepairs();
  }, [loadRepairs]);

  // Add a new repair
  const addRepair = useCallback((repair: Repair) => {
    setRepairs(prev => {
      const exists = prev.some(r => r._id === repair._id);
      if (exists) {
        return prev.map(r => r._id === repair._id ? repair : r);
      }
      return [repair, ...prev];
    });
    setLastUpdated(new Date());
  }, []);

  // Update an existing repair
  const updateRepair = useCallback((repair: Repair) => {
    setRepairs(prev => 
      prev.map(r => r._id === repair._id ? repair : r)
    );
    setLastUpdated(new Date());
  }, []);

  // Delete a repair
  const deleteRepair = useCallback((repairId: string) => {
    setRepairs(prev => prev.filter(r => r._id !== repairId));
    setLastUpdated(new Date());
  }, []);

  // Get repair by ID
  const getRepairById = useCallback((id: string) => {
    return repairs.find(r => r._id === id);
  }, [repairs]);

  // Clear all repairs
  const clearRepairs = useCallback(() => {
    setRepairs([]);
    setLastUpdated(null);
    setError(null);
    setTotalCustomers(0);
  }, []);

  // Auto-load repairs when user logs in
  useEffect(() => {
    if (user) {
      loadRepairs();
    } else {
      clearRepairs();
    }
  }, [user, loadRepairs, clearRepairs]);

  // Calculate stats whenever repairs change
  const stats = calculateStats(repairs);
  const dashboardStats = calculateDashboardStats(repairs);

  const value = {
    repairs,
    stats,
    dashboardStats,
    loading,
    error,
    lastUpdated,
    totalCustomers,
    setTotalCustomers,
    loadRepairs,
    addRepair,
    updateRepair,
    deleteRepair,
    getRepairById,
    clearRepairs,
    refreshRepairs,
  };

  return (
    <RepairContext.Provider value={value}>
      {children}
    </RepairContext.Provider>
  );
}

// Custom hook to use repair context
export function useRepairs() {
  const context = useContext(RepairContext);
  if (context === undefined) {
    throw new Error('useRepairs must be used within a RepairProvider');
  }
  return context;
}