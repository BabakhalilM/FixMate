import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import ScreenWrapper from '@/components/ScreenWrapper';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function PrivacyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [settings, setSettings] = useState({
    shareLocation: true,
    shareContact: true,
    showOnlineStatus: true,
    dataAnalytics: false,
    marketingEmails: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const saveSettings = () => {
    Alert.alert('Success', 'Privacy settings updated!');
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy</Text>
          <TouchableOpacity onPress={saveSettings}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy Settings</Text>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Share Location</Text>
              <Text style={styles.settingDescription}>
                Allow customers to see your location when on a job
              </Text>
            </View>
            <Switch
              value={settings.shareLocation}
              onValueChange={() => toggleSetting('shareLocation')}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
              thumbColor={settings.shareLocation ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Share Contact Info</Text>
              <Text style={styles.settingDescription}>
                Allow customers to see your phone number
              </Text>
            </View>
            <Switch
              value={settings.shareContact}
              onValueChange={() => toggleSetting('shareContact')}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
              thumbColor={settings.shareContact ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Show Online Status</Text>
              <Text style={styles.settingDescription}>
                Display when you're available for jobs
              </Text>
            </View>
            <Switch
              value={settings.showOnlineStatus}
              onValueChange={() => toggleSetting('showOnlineStatus')}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
              thumbColor={settings.showOnlineStatus ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Data Analytics</Text>
              <Text style={styles.settingDescription}>
                Help improve the app by sharing usage data
              </Text>
            </View>
            <Switch
              value={settings.dataAnalytics}
              onValueChange={() => toggleSetting('dataAnalytics')}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
              thumbColor={settings.dataAnalytics ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Marketing Emails</Text>
              <Text style={styles.settingDescription}>
                Receive promotional emails and updates
              </Text>
            </View>
            <Switch
              value={settings.marketingEmails}
              onValueChange={() => toggleSetting('marketingEmails')}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
              thumbColor={settings.marketingEmails ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal</Text>
          
          <TouchableOpacity style={styles.legalItem}>
            <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
            <Text style={styles.legalText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalItem}>
            <Ionicons name="shield-outline" size={20} color="#4F46E5" />
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalItem}>
            <Ionicons name="file-tray-full-outline" size={20} color="#4F46E5" />
            <Text style={styles.legalText}>Cookie Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Data */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data</Text>
          
          <TouchableOpacity
            style={styles.dataButton}
            onPress={() => Alert.alert('Download Data', 'Your data will be downloaded shortly')}
          >
            <Ionicons name="download-outline" size={20} color="#4F46E5" />
            <Text style={styles.dataButtonText}>Download Your Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataButton, styles.deleteButton]}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive' },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
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
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  legalText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  dataButtonText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
    paddingTop: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#DC2626',
  },
});