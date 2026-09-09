import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import ScreenWrapper from '@/components/ScreenWrapper';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function PaymentSettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [upiId, setUpiId] = useState('technician@upi');
  const [bankAccount, setBankAccount] = useState({
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    accountHolder: 'Technician Name',
  });
  const [autoWithdraw, setAutoWithdraw] = useState(true);
  const [withdrawThreshold, setWithdrawThreshold] = useState('1000');
  const [selectedMethod, setSelectedMethod] = useState('upi');

  const saveSettings = () => {
    Alert.alert('Success', 'Payment settings saved successfully!');
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Settings</Text>
          <TouchableOpacity onPress={saveSettings}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Summary */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Available Balance</Text>
          <Text style={styles.earningsAmount}>₹12,450</Text>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>Withdraw Now</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.methodOption, selectedMethod === 'upi' && styles.methodOptionActive]}
            onPress={() => setSelectedMethod('upi')}
          >
            <View style={styles.methodLeft}>
              <View style={styles.methodIcon}>
                <Text style={styles.methodIconText}>💳</Text>
              </View>
              <View>
                <Text style={styles.methodName}>UPI</Text>
                <Text style={styles.methodDescription}>Pay using UPI ID</Text>
              </View>
            </View>
            {selectedMethod === 'upi' && (
              <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
            )}
          </TouchableOpacity>

          {selectedMethod === 'upi' && (
            <View style={styles.methodDetails}>
              <TextInput
                style={styles.input}
                placeholder="Enter UPI ID"
                value={upiId}
                onChangeText={setUpiId}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.methodOption, selectedMethod === 'bank' && styles.methodOptionActive]}
            onPress={() => setSelectedMethod('bank')}
          >
            <View style={styles.methodLeft}>
              <View style={styles.methodIcon}>
                <Text style={styles.methodIconText}>🏦</Text>
              </View>
              <View>
                <Text style={styles.methodName}>Bank Transfer</Text>
                <Text style={styles.methodDescription}>Direct bank transfer</Text>
              </View>
            </View>
            {selectedMethod === 'bank' && (
              <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
            )}
          </TouchableOpacity>

          {selectedMethod === 'bank' && (
            <View style={styles.methodDetails}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account holder name"
                  value={bankAccount.accountHolder}
                  onChangeText={(text) => setBankAccount({ ...bankAccount, accountHolder: text })}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account number"
                  value={bankAccount.accountNumber}
                  onChangeText={(text) => setBankAccount({ ...bankAccount, accountNumber: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter IFSC code"
                  value={bankAccount.ifscCode}
                  onChangeText={(text) => setBankAccount({ ...bankAccount, ifscCode: text })}
                />
              </View>
            </View>
          )}
        </View>

        {/* Withdrawal Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Withdrawal Settings</Text>
          
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Auto-Withdraw</Text>
              <Text style={styles.settingDescription}>
                Automatically withdraw earnings daily
              </Text>
            </View>
            <Switch
              value={autoWithdraw}
              onValueChange={setAutoWithdraw}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
              thumbColor={autoWithdraw ? '#fff' : '#f4f3f4'}
            />
          </View>

          {autoWithdraw && (
            <View style={styles.thresholdContainer}>
              <Text style={styles.thresholdLabel}>Withdraw Threshold</Text>
              <View style={styles.thresholdInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.thresholdInput}
                  value={withdrawThreshold}
                  onChangeText={setWithdrawThreshold}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.thresholdHint}>
                Auto-withdraw when balance exceeds this amount
              </Text>
            </View>
          )}
        </View>

        {/* Transaction History */}
        <View style={styles.card}>
          <View style={styles.historyHeader}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {[
            { id: '1', type: 'Earning', amount: '+₹450', date: 'Today, 2:30 PM', status: 'Completed' },
            { id: '2', type: 'Withdrawal', amount: '-₹1,000', date: 'Yesterday, 10:15 AM', status: 'Processing' },
            { id: '3', type: 'Earning', amount: '+₹350', date: 'Jan 15, 4:45 PM', status: 'Completed' },
          ].map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  transaction.type === 'Earning' ? styles.earningIcon : styles.withdrawalIcon
                ]}>
                  <Ionicons
                    name={transaction.type === 'Earning' ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color={transaction.type === 'Earning' ? '#059669' : '#DC2626'}
                  />
                </View>
                <View>
                  <Text style={styles.transactionType}>{transaction.type}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'Earning' ? styles.earningAmount : styles.withdrawalAmount
                ]}>
                  {transaction.amount}
                </Text>
                <Text style={[
                  styles.transactionStatus,
                  transaction.status === 'Completed' ? styles.statusCompleted : styles.statusProcessing
                ]}>
                  {transaction.status}
                </Text>
              </View>
            </View>
          ))}
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
  earningsCard: {
    backgroundColor: '#4F46E5',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#C7D2FE',
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  withdrawButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  withdrawButtonText: {
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
  methodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  methodOptionActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconText: {
    fontSize: 20,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  methodDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  methodDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  thresholdContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  thresholdInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 4,
  },
  thresholdInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  thresholdHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningIcon: {
    backgroundColor: '#ECFDF5',
  },
  withdrawalIcon: {
    backgroundColor: '#FEF2F2',
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  earningAmount: {
    color: '#059669',
  },
  withdrawalAmount: {
    color: '#DC2626',
  },
  transactionStatus: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statusCompleted: {
    color: '#059669',
  },
  statusProcessing: {
    color: '#D97706',
  },
});