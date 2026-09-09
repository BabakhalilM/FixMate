import React from 'react';
import { View, Platform, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
}

export default function ScreenWrapper({ 
  children, 
  scrollable = true,
  backgroundColor = '#f5f5f5'
}: ScreenWrapperProps) {
  if (Platform.OS === 'web') {
    return (
      <div style={{
        height: '100vh',
        overflow: scrollable ? 'auto' : 'hidden',
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});