// apps/technician-app/src/screens/JobDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBadge } from '@/components/StatusBadge';
// import { StatusBadge } from '../components/StatusBadge';

const mockJobDetail = {
  id: '1',
  customer: 'Priya Sharma',
  device: 'LG Split AC 1.5 Ton',
  issue: 'Not cooling properly',
  description: 'The AC is not cooling at all. Compressor seems to be working but no cold air.',
  status: 'pending',
  date: '2024-01-15',
  time: '10:00 AM',
  location: 'Indiranagar, Bangalore',
  amount: 999,
  customerPhone: '+91 98765 43210',
  customerEmail: 'priya@example.com',
};

export default function JobDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // const { jobId } = route.params as { jobId: string };
  
  const [job, setJob] = useState(mockJobDetail);
  const [diagnosis, setDiagnosis] = useState('');
  const [parts, setParts] = useState('');

  const handleStatusUpdate = (status: string) => {
    Alert.alert(
      'Update Status',
      `Mark this job as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            setJob({ ...job, status });
            Alert.alert('Success', `Job status updated to ${status}`);
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Job Info */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Text style={styles.device}>{job.device}</Text>
          <StatusBadge status={job.status} />
        </View>
        <Text style={styles.customer}>{job.customer}</Text>
        <Text style={styles.issue}>{job.issue}</Text>
        <Text style={styles.description}>{job.description}</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📱 Phone:</Text>
          <Text style={styles.infoValue}>{job.customerPhone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📧 Email:</Text>
          <Text style={styles.infoValue}>{job.customerEmail}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Location:</Text>
          <Text style={styles.infoValue}>{job.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🕐 Date/Time:</Text>
          <Text style={styles.infoValue}>{job.date} at {job.time}</Text>
        </View>
      </View>

      {/* Status Update */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        <View style={styles.statusButtons}>
          {['pending', 'accepted', 'in-progress', 'completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusBtn,
                job.status === status && styles.activeStatusBtn,
              ]}
              onPress={() => handleStatusUpdate(status)}
            >
              <Text style={[
                styles.statusBtnText,
                job.status === status && styles.activeStatusBtnText,
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Diagnosis */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Diagnosis</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Enter diagnosis details..."
          multiline
          numberOfLines={4}
          value={diagnosis}
          onChangeText={setDiagnosis}
        />
        <TextInput
          style={[styles.textArea, { marginTop: 12 }]}
          placeholder="Parts needed..."
          multiline
          numberOfLines={2}
          value={parts}
          onChangeText={setParts}
        />
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Submit Diagnosis</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.callBtn}>
          <Text style={styles.actionBtnText}>📞 Call Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageBtn}>
          <Text style={styles.actionBtnText}>💬 Send Message</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  device: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  customer: {
    fontSize: 16,
    color: '#4F46E5',
    marginTop: 8,
  },
  issue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a2e',
    flex: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  activeStatusBtn: {
    backgroundColor: '#4F46E5',
  },
  statusBtnText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  activeStatusBtnText: {
    color: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  messageBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});