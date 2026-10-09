import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import SplashScreen from "@/screens/login/SplashScreen";
import OnboardingScreen from "@/screens/login/OnboardingScreen";
import LoginScreen from "@/screens/login/LoginScreen";
import RegisterScreen from "@/screens/login/RegisterScreen";
import TechnicianDashboard from "@/screens/TechnicianDashboard";
import JobDetailScreen from "@/screens/JobDetailScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "./src/navigation/types";
import CustomerSearch from "@/screens/CustomerSearch";
import NewRepair from "@/screens/NewRepair";
import DeviceTypeManager from "@/screens/DeviceTypeManager";
import EarningsScreen from "@/screens/EarningsScreen";
import PaymentSettingsScreen from "@/screens/PaymentSettingsScreen";
import ReviewsScreen from "@/screens/ReviewsScreen";
import MyServicesScreen from "@/screens/MyServicesScreen";
import PersonalInfoScreen from "@/screens/PersonalInfoScreen";
import NotificationsScreen from "@/screens/NotificationScreen";
import SupportScreen from "@/screens/SupportsScreen";
import PrivacyScreen from "@/screens/PrivacyScreen";
import { RepairProvider } from "@/context/repairContext";
import RepairDetailScreen from "@/screens/RepairDetailScreen";
import * as Sentry from "@sentry/react-native";
import RepairsScreen from "@/screens/RepairsScreen";
import CustomersScreen from "@/screens/CustomersScreen";
import ServiceDetailScreen from "@/screens/ServicesDetailsScreen";
import AvailabilityScreen from "@/screens/AvailabilityScreen";
import CustomerDetailScreen from "@/screens/CustomerDetailScreen";
import ForgotPasswordScreen from "@/screens/login/ForgotPassword";

Sentry.init({
  dsn: "https://7646562e92fcb0acf7bc223d91b5ea9f@o4512071233175552.ingest.us.sentry.io/4512071272562688",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const Stack = createStackNavigator<RootStackParamList>();

// Web styles to fix scrolling
const webStyles = `
  html, body, #root {
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }
  div[style*="flex: 1"] {
    height: 100% !important;
    min-height: 100vh !important;
  }
  div[style*="position: absolute"] {
    height: 100% !important;
    min-height: 100vh !important;
  }
  div[class*="ScrollView"] {
    height: 100% !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  [data-rnw-root] {
    height: 100vh !important;
    min-height: 100vh !important;
  }
`;

function AppNavigator() {
  const { isLoading, isAuthenticated, hasCompletedOnboarding, isRegistered } =
    useAuth();

  // cast to any to avoid type mismatch for web-specific cardStyle value
  const screenOptions: any = {
    headerShown: false,
    cardStyle: Platform.OS === "web" ? { height: "100vh" } : undefined,
  };

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  if (isAuthenticated) {
    return (
      <RepairProvider>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Dashboard" component={TechnicianDashboard} />
          <Stack.Screen name="JobDetail" component={JobDetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
          <Stack.Screen name="MyServices" component={MyServicesScreen} />
          <Stack.Screen name="Availability" component={AvailabilityScreen} />
          <Stack.Screen name="Reviews" component={ReviewsScreen} />
          <Stack.Screen
            name="PaymentSettings"
            component={PaymentSettingsScreen}
          />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
          <Stack.Screen
            name="TechnicianDashboard"
            component={TechnicianDashboard}
            options={{
              headerShown: false,
            }}
          />

          {/* Customer Management */}
          <Stack.Screen
            name="CustomerSearch"
            component={CustomerSearch}
            options={{
              headerShown: false,
            }}
          />

          {/* <Stack.Screen
                  name="AddCustomer"
                  component={AddCustomer}
                  options={{
                    title: "Add Customer",
                    headerShown: true,
                    }}
                /> */}

          {/* <Stack.Screen
                  name="CustomerHistory"
                  component={CustomerHistory}
                  options={{
                    title: "Customer History",
                    headerShown: true,
                    }}
                    /> */}

          {/* Repair Management */}
          <Stack.Screen
            name="NewRepair"
            component={NewRepair}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="DeviceTypeManager"
            component={DeviceTypeManager}
            options={{
              title: "Device Configuration",
              headerShown: true,
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => {
                    // You can add a help or info button here
                    console.log("Help pressed");
                  }}
                  style={{ marginRight: 16 }}
                >
                  <Ionicons name="help-circle-outline" size={24} color="#fff" />
                </TouchableOpacity>
              ),
            }}
          />

          <Stack.Screen
            name="Earnings"
            component={EarningsScreen}
            options={{
              title: "Earnings",
              headerShown: false,
            }}
          />

          {/* <Stack.Screen
                  name="Inventory"
                  component={Inventory}
                  options={{
                    title: "Inventory",
                    headerShown: true,
                    }}
                /> */}
          <Stack.Screen name="Customers" component={CustomersScreen} />
          <Stack.Screen
            name="CustomerDetail"
            component={CustomerDetailScreen}
          />
          {/* <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
              <Stack.Screen name="CustomerSearch" component={CustomerSearchScreen} /> */}
          <Stack.Screen name="Repairs" component={RepairsScreen} />
          <Stack.Screen name="RepairDetail" component={RepairDetailScreen} />
        </Stack.Navigator>
      </RepairProvider>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isRegistered ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Sentry.wrap(function App() {
  useEffect(() => {
    if (Platform.OS === "web") {
      const styleTag = document.createElement("style");
      styleTag.textContent = webStyles;
      document.head.appendChild(styleTag);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <View style={styles.container}>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
});
