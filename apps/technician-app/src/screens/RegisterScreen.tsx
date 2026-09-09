// apps/technician-app/src/screens/RegisterScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { RootStackParamList } from "@/navigation/types";
import ScreenWrapper from "@/components/ScreenWrapper";
import LocationPicker from "@/components/LocationPicker";
import { DEVICE_TYPES } from "@/utils/data";

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic, 2: Profile, 3: Services
  const { setIsRegistered, register, isLoading: authLoading } = useAuth();
  const [error, setError] = useState("");
  type FormData = {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    experience: string;
    location: string;
    lat: string;
    lng: string;
    available: boolean;
    specialties: string[];
    certifications: string[];
  };

  const [selectedLocation, setSelectedLocation] = useState({
    address: "",
    lat: 14.6819,
    lng: 77.6006,
  });
  const handleLocationSelect = (location: {
    address: string;
    lat: number;
    lng: number;
  }) => {
    console.log("Selected Location:", location);
    setSelectedLocation(location);

    setFormData((prev) => ({
      ...prev,
      location: location.address,
      lat: location.lat.toString(),
      lng: location.lng.toString(),
    }));
  };
  const [formData, setFormData] = useState<FormData>({
    // Step 1
    name: "Baba Khalil",
    email: ``, // unique email every refresh
    phone: "9876543210",
    password: "123456",
    confirmPassword: "123456",

    // Step 2
    experience: "2",
    location: "Om Nagar, Anantapur",
    lat: "14.6819",
    lng: "77.6006",
    available: true,

    // Step 3
    specialties: [],
    certifications: ["ITI Certified", "Diploma in Electronics"],
  });
  const AvailableServices = DEVICE_TYPES.map(({ id, label }) => ({
    id,
    label,
  }));
  // const handleInputChange = (field: string, value: any) => {
  //   setFormData({ ...formData, [field]: value });
  // };
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // const toggleService = (service: string) => {
  //   setFormData((prev) => {
  //     const newSpecialties = prev.specialties.includes(service)
  //       ? prev.specialties.filter((s) => s !== service)
  //       : [...prev.specialties, service];
  //     return { ...prev, specialties: newSpecialties };
  //   });
  // };
  const toggleService = (serviceId: string) => {
    setFormData((prev) => {
      const newSpecialties = prev.specialties.includes(serviceId)
        ? prev.specialties.filter((s) => s !== serviceId)
        : [...prev.specialties, serviceId];

      return { ...prev, specialties: newSpecialties };
    });
  };

  const toggleCertification = (cert: string) => {
    setFormData((prev) => {
      const newCerts = prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert];
      return { ...prev, certifications: newCerts };
    });
  };

  const validateStep1 = () => {
    if (!formData.name) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }
    if (!formData.email) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!formData.phone) {
      Alert.alert("Error", "Please enter your phone number");
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.experience) {
      Alert.alert("Error", "Please enter your experience");
      return false;
    }
    if (!formData.location) {
      Alert.alert("Error", "Please enter your location");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.specialties.length === 0) {
      Alert.alert("Error", "Please select at least one service");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const response = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: "technician",
        profile: {
          experience: parseInt(formData.experience),
          location: formData.location,
          coordinates: {
            lat: parseFloat(formData.lat) || 0,
            lng: parseFloat(formData.lng) || 0,
          },
          specialties: formData.specialties,
          certifications: formData.certifications,
          availability: formData.available,
        },
      });
      if (response.success) {
        Alert.alert(
          "Registration Successful! 🎉",
          "Your account has been created and is pending admin approval. You will be notified once approved.",
          [
            {
              text: "OK",
              onPress: async () => {
                await AsyncStorage.setItem("registered", "true");

                setIsRegistered(true);
              },
            },
          ],
        );
      }
    } catch (error: any) {
      setError(error.message);
      Alert.alert(
        "Registration Failed",
        error.response?.data?.error || "Please try again",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          placeholderTextColor="#999"
          value={formData.name}
          onChangeText={(text) => handleInputChange("name", text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="john@example.com"
          placeholderTextColor="#999"
          value={formData.email}
          onChangeText={(text) => handleInputChange("email", text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 98765 43210"
          placeholderTextColor="#999"
          value={formData.phone}
          onChangeText={(text) => handleInputChange("phone", text)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#999"
          value={formData.password}
          onChangeText={(text) => handleInputChange("password", text)}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#999"
          value={formData.confirmPassword}
          onChangeText={(text) => handleInputChange("confirmPassword", text)}
          secureTextEntry
        />
      </View>
    </View>
  );

  // const renderStep2 = () => (
  //   <View style={styles.stepContainer}>
  //     <Text style={styles.stepTitle}>Professional Details</Text>
  //     <Text style={styles.stepSubtitle}>Tell us about your experience</Text>

  //     <View style={styles.inputContainer}>
  //       <Text style={styles.label}>Years of Experience *</Text>
  //       <TextInput
  //         style={styles.input}
  //         placeholder="5"
  //         value={formData.experience}
  //         onChangeText={(text) => handleInputChange("experience", text)}
  //         keyboardType="number-pad"
  //       />
  //     </View>

  //     <View style={styles.inputContainer}>
  //       <Text style={styles.label}>Your Location *</Text>
  //       {/* <TextInput
  //         style={styles.input}
  //         placeholder="Indiranagar, Bangalore"
  //         value={formData.location}
  //         onChangeText={(text) => handleInputChange("location", text)}
  //       /> */}
  //       {/* <LocationPicker
  //       onLocationSelect={handleLocationSelect}
  //       initialLocation={selectedLocation}
  //     /> */}
  //       <LocationPicker
  //         onLocationSelect={handleLocationSelect}
  //         initialLocation={selectedLocation}
  //       />
  //     </View>

  //     <View style={styles.rowContainer}>
  //       <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
  //         <Text style={styles.label}>Latitude</Text>
  //         <TextInput
  //           style={styles.input}
  //           placeholder="12.9716"
  //           value={formData.lat}
  //           onChangeText={(text) => handleInputChange("lat", text)}
  //           keyboardType="decimal-pad"
  //         />
  //       </View>
  //       <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
  //         <Text style={styles.label}>Longitude</Text>
  //         <TextInput
  //           style={styles.input}
  //           placeholder="77.5946"
  //           value={formData.lng}
  //           onChangeText={(text) => handleInputChange("lng", text)}
  //           keyboardType="decimal-pad"
  //         />
  //       </View>
  //     </View>

  //     <View style={styles.switchContainer}>
  //       <Text style={styles.label}>Available for Work</Text>
  //       <Switch
  //         value={formData.available}
  //         onValueChange={(value) => handleInputChange("available", value)}
  //         trackColor={{ false: "#767577", true: "#4F46E5" }}
  //         thumbColor={formData.available ? "#fff" : "#f4f3f4"}
  //       />
  //     </View>
  //   </View>
  // );
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Professional Details</Text>
      <Text style={styles.stepSubtitle}>Tell us about your experience</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Years of Experience *</Text>
        <TextInput
          style={styles.input}
          placeholder="5"
          value={formData.experience}
          onChangeText={(text) => handleInputChange("experience", text)}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Location *</Text>
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          initialLocation={selectedLocation}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Available for Work</Text>
        <Switch
          value={formData.available}
          onValueChange={(value) => handleInputChange("available", value)}
          trackColor={{ false: "#767577", true: "#4F46E5" }}
          thumbColor={formData.available ? "#fff" : "#f4f3f4"}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Services & Certifications</Text>
      <Text style={styles.stepSubtitle}>Select your specialties</Text>

      <Text style={styles.sectionLabel}>Services You Offer *</Text>
      <View style={styles.servicesGrid}>
        {AvailableServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceChip,
              formData.specialties.includes(service.id) &&
                styles.serviceChipActive,
            ]}
            onPress={() => toggleService(service.id)}
          >
            <Text
              style={[
                styles.serviceChipText,
                formData.specialties.includes(service.id) &&
                  styles.serviceChipTextActive,
              ]}
            >
              {service.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
        Certifications (Optional)
      </Text>
      <View style={styles.servicesGrid}>
        {[
          "ITI Certified",
          "Diploma in Electronics",
          "B.Tech",
          "NITI Aayog Certified",
        ].map((cert) => (
          <TouchableOpacity
            key={cert}
            style={[
              styles.serviceChip,
              formData.certifications.includes(cert) &&
                styles.serviceChipActive,
            ]}
            onPress={() => toggleCertification(cert)}
          >
            <Text
              style={[
                styles.serviceChipText,
                formData.certifications.includes(cert) &&
                  styles.serviceChipTextActive,
              ]}
            >
              {cert}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenWrapper scrollable={true}>
      {/* <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      > */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]}
              />
            </View>
            <Text style={styles.progressText}>Step {step} of 3</Text>
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {error ? (
            <Text
              style={{
                color: "red",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          ) : null}
          <View style={styles.buttonContainer}>
            {step > 1 && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setStep(step - 1)}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Back
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                step === 3 && styles.buttonSuccess,
              ]}
              onPress={step === 3 ? handleSubmit : handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {step === 3 ? "Complete Registration" : "Next"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {/* </KeyboardAvoidingView> */}
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  progressContainer: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    textAlign: "right",
  },
  stepContainer: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  rowContainer: {
    flexDirection: "row",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    marginBottom: 8,
  },
  serviceChipActive: {
    backgroundColor: "#4F46E5",
  },
  serviceChipText: {
    fontSize: 14,
    color: "#666",
  },
  serviceChipTextActive: {
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: "#4F46E5",
  },
  buttonSecondary: {
    backgroundColor: "#f0f0f0",
  },
  buttonSuccess: {
    backgroundColor: "#059669",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonTextSecondary: {
    color: "#666",
  },
  loginLink: {
    alignItems: "center",
    padding: 16,
    marginBottom: 20,
  },
  loginLinkText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "500",
  },
});
