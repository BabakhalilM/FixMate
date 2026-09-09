import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import ScreenWrapper from '@/components/ScreenWrapper';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface DaySchedule {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

export default function AvailabilityScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [workingDays, setWorkingDays] = useState<DaySchedule[]>([
    { day: 'Monday', enabled: true, start: '09:00', end: '18:00' },
    { day: 'Tuesday', enabled: true, start: '09:00', end: '18:00' },
    { day: 'Wednesday', enabled: true, start: '09:00', end: '18:00' },
    { day: 'Thursday', enabled: true, start: '09:00', end: '18:00' },
    { day: 'Friday', enabled: true, start: '09:00', end: '18:00' },
    { day: 'Saturday', enabled: false, start: '10:00', end: '14:00' },
    { day: 'Sunday', enabled: false, start: '10:00', end: '14:00' },
  ]);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState('5');

  const toggleDay = (index: number) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index].enabled = !newWorkingDays[index].enabled;
    setWorkingDays(newWorkingDays);
  };

  const updateTime = (index: number, field: 'start' | 'end', value: string) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index][field] = value;
    setWorkingDays(newWorkingDays);
  };

  const saveAvailability = () => {
    Alert.alert('Success', 'Availability settings saved successfully!');
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Availability</Text>
          <TouchableOpacity onPress={saveAvailability}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Mode */}
        <View style={styles.card}>
          <View style={styles.emergencyHeader}>
            <View>
              <Text style={styles.emergencyTitle}>🚨 Emergency Mode</Text>
              <Text style={styles.emergencyDescription}>
                Temporarily mark yourself as unavailable for new bookings
              </Text>
            </View>
            <Switch
              value={emergencyMode}
              onValueChange={setEmergencyMode}
              trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
              thumbColor={emergencyMode ? '#fff' : '#f4f3f4'}
            />
          </View>
          {emergencyMode && (
            <View style={styles.emergencyInfo}>
              <Ionicons name="warning" size={20} color="#EF4444" />
              <Text style={styles.emergencyInfoText}>
                You are currently in emergency mode. No new bookings will be accepted.
              </Text>
            </View>
          )}
        </View>

        {/* Working Days */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Working Days & Hours</Text>
          <Text style={styles.cardSubtitle}>
            Set your availability for each day of the week
          </Text>

          {workingDays.map((day, index) => (
            <View key={index} style={styles.dayRow}>
              <View style={styles.dayInfo}>
                <Text style={[styles.dayText, day.enabled && styles.dayActive]}>
                  {day.day}
                </Text>
                <View style={styles.timeContainer}>
                  <TextInput
                    style={[styles.timeInput, !day.enabled && styles.timeInputDisabled]}
                    value={day.start}
                    onChangeText={(text) => updateTime(index, 'start', text)}
                    editable={day.enabled}
                    placeholder="09:00"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.timeSeparator}>-</Text>
                  <TextInput
                    style={[styles.timeInput, !day.enabled && styles.timeInputDisabled]}
                    value={day.end}
                    onChangeText={(text) => updateTime(index, 'end', text)}
                    editable={day.enabled}
                    placeholder="18:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <Switch
                value={day.enabled}
                onValueChange={() => toggleDay(index)}
                trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
                thumbColor={day.enabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        {/* Max Bookings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Maximum Bookings</Text>
          <Text style={styles.cardSubtitle}>
            Set the maximum number of bookings you can handle per day
          </Text>
          <View style={styles.maxBookingsContainer}>
            <TouchableOpacity
              style={styles.bookingsButton}
              onPress={() => {
                const current = parseInt(maxBookingsPerDay);
                if (current > 1) setMaxBookingsPerDay((current - 1).toString());
              }}
            >
              <Ionicons name="remove" size={20} color="#4F46E5" />
            </TouchableOpacity>
            <Text style={styles.bookingsValue}>{maxBookingsPerDay}</Text>
            <TouchableOpacity
              style={styles.bookingsButton}
              onPress={() => {
                const current = parseInt(maxBookingsPerDay);
                if (current < 20) setMaxBookingsPerDay((current + 1).toString());
              }}
            >
              <Ionicons name="add" size={20} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setWorkingDays(workingDays.map(day => ({ ...day, enabled: true })));
            }}
          >
            <Text style={styles.quickActionText}>Set All Days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionClear]}
            onPress={() => {
              setWorkingDays(workingDays.map(day => ({ ...day, enabled: false })));
            }}
          >
            <Text style={[styles.quickActionText, styles.quickActionTextClear]}>
              Clear All Days
            </Text>
          </TouchableOpacity>
        </View>
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
  saveText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emergencyDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  emergencyInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayText: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
  },
  dayActive: {
    color: '#1F2937',
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeInput: {
    width: 50,
    padding: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeInputDisabled: {
    opacity: 0.5,
  },
  timeSeparator: {
    color: '#6B7280',
  },
  maxBookingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  bookingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  quickActionClear: {
    backgroundColor: '#F3F4F6',
  },
  quickActionText: {
    color: '#fff',
    fontWeight: '500',
  },
  quickActionTextClear: {
    color: '#6B7280',
  },
});