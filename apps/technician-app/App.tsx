import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import SplashScreen from "@/screens/SplashScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
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
        <Stack.Screen name="JobDetail" component={JobDetailScreen} />
        <Stack.Screen name="Dashboard" component={TechnicianDashboard} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="MyServices" component={MyServicesScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen
          name="PaymentSettings"
          component={PaymentSettingsScreen}
        />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />

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
          name="RepairDetail"
          component={RepairDetailScreen}
          options={{
            title: "Repair Details",
            headerShown: true,
            }}
        />

        {/* <Stack.Screen
          name="Jobs"
          component={Jobs}
          options={{
            title: "All Jobs",
            headerShown: true,
            }}
        /> */}

        {/* Device Configuration */}
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

        {/* Earnings & Inventory */}
        <Stack.Screen
          name="Earnings"
          component={EarningsScreen}
          options={{
            title: "Earnings",
            headerShown: true,
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

        {/* Profile */}
        {/* <Stack.Screen
          name="Profile"
          component={Profile}
          options={{
            title: "Profile",
            headerShown: true,
            }}
            /> */}
      </Stack.Navigator>
    </RepairProvider>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={isRegistered ? "Login" : "Register"}
    >
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function App() {
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
}
