// apps/technician-app/src/screens/NewRepair.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import {
  NavigationProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import repairService, {
  Repair,
  CreateRepairData,
} from "@/services/RepairService";
import DynamicDeviceSpecsForm from "./DynamicDeviceSpecsForm";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigation/types";
import { useAuth } from "@/context/AuthContext";
import { DEVICE_TYPES } from "@/utils/data";
import CustomerService from "@/services/CustomerService";
import { useRepairs } from "@/context/repairContext";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { DeviceConfigService } from "@/services";

// ---------------------------------------------------------------------------
// Cross-platform alert helper.
// React Native's `Alert.alert` only renders a native dialog on iOS/Android.
// On web (react-native-web) it is a no-op, so we fall back to
// `window.alert` / `window.confirm` there while keeping the exact same
// call signature (title, message, buttons) used everywhere else in this file.
// ---------------------------------------------------------------------------
type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  if (Platform.OS === "web") {
    // No buttons (or a single implicit "OK") -> simple alert box.
    if (!buttons || buttons.length <= 1) {
      if (typeof window !== "undefined") {
        window.alert(message ? `${title}\n\n${message}` : title);
      }
      buttons?.[0]?.onPress?.();
      return;
    }

    // Multiple buttons -> use confirm() so the user can still choose
    // between two actions (e.g. Cancel / OK) on web.
    const confirmButton =
      buttons.find((b) => b.style !== "cancel") ?? buttons[buttons.length - 1];
    const cancelButton = buttons.find((b) => b.style === "cancel");

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        message ? `${title}\n\n${message}` : title,
      );
      if (confirmed) {
        confirmButton?.onPress?.();
      } else {
        cancelButton?.onPress?.();
      }
    }
    return;
  }

  // Native (iOS/Android) - use the regular RN Alert API.
  Alert.alert(title, message, buttons as any);
};

type NewRepairRouteParams = {
  customerId?: string;
  existingCustomer?: any;
};

type NewRepairRoute = RouteProp<
  {
    NewRepair: NewRepairRouteParams;
  },
  "NewRepair"
>;

export default function NewRepair() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<NewRepairRoute>();
  const { addRepair } = useRepairs();
  const { existingCustomer } = route.params ?? {};

  const [customer, setCustomer] = useState<any>(null);
  const [customerId, setCustomerId] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState("");
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [deviceConfig, setDeviceConfig] = useState<any>(null);

  
  const [repairData, setRepairData] = useState({
    customerId: "",
    customerName: "Baba",
    customerPhone: "",
    deviceType: "",
    brand: "LG",
    model: "345",
    serialNumber: "23445",
    problemDescription: "325tegfgt",
    status: "pending",
    charges: "543",
    estimatedDays: "534",
    deviceSpecs: {},
    images: [],
  });
  // Add these state variables near your other states
  const [selectedDeviceTypeForAI, setSelectedDeviceTypeForAI] =
    useState<string>("");
  const { user } = useAuth();
  const processImage = async (
    uri: string,
  ): Promise<{ uri: string; width: number; height: number }> => {
    try {
      // Resize image to max 1024px width/height while maintaining aspect ratio
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1024,
              height: 1024,
            },
          },
        ],
        {
          compress: 0.7, // 70% quality (good balance between size and quality)
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      return result;
    } catch (error) {
      console.error("Error processing image:", error);
      // Return original if compression fails
      return { uri, width: 0, height: 0 };
    }
  };
  // Separate state for AI scanning images (temporary, not stored)
  const [aiScanImages, setAiScanImages] = useState<string[]>([]);

  // Separate state for repair images (stored with repair)
  const [repairImages, setRepairImages] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [createdRepair, setCreatedRepair] = useState<any>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiExtractedData, setAiExtractedData] = useState<any>(null);

  const deviceTypes =
    user?.role === "technician"
      ? DEVICE_TYPES.filter((device) =>
          user.profile?.specialties?.includes(device.id),
        )
      : DEVICE_TYPES;

  useEffect(() => {
    if (existingCustomer) {
      setCustomer(existingCustomer);
      setCustomerId(existingCustomer._id);
      setRepairData((prev) => ({
        ...prev,
        customerId: existingCustomer._id,
        customerName: existingCustomer.name,
        customerPhone: existingCustomer.phone,
      }));
    }
  }, [existingCustomer]);
  const imageToBase64 = async (uri: string): Promise<string> => {
    try {
      // For React Native, use FileReader or fetch
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting to base64:", error);
      return uri; // Return original URI as fallback
    }
  };
  const compressImage = async (
    uri: string,
    maxWidth: number = 800,
    quality: number = 0.6,
  ): Promise<string> => {
    try {
      console.log(`🖼️ Compressing image: ${uri.substring(0, 30)}...`);

      // Use ImageManipulator to resize and compress
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxWidth,
            },
          },
        ],
        {
          compress: quality, // 0.6 = 60% quality
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      console.log(`✅ Compressed: ${(result.uri.length / 1024).toFixed(1)}KB`);
      return result.uri;
    } catch (error) {
      console.error("❌ Compression failed:", error);
      return uri; // Return original if compression fails
    }
  };

  // AI Auto-fill function - uses aiScanImages (temporary)
  // const autoFillFromImages = async () => {
  //   if (aiScanImages.length === 0) {
  //     showAlert(
  //       "No Images",
  //       "Please add at least one image to scan for auto-fill.",
  //     );
  //     return;
  //   }

  //   // Show loading modal
  //   setIsAutoFilling(true);
  //   setShowAIModal(true);

  //   try {
  //     console.log("🔄 Starting AI auto-fill process...");

  //     // Compress images
  //     const compressedImages = await Promise.all(
  //       aiScanImages.map(async (uri) => {
  //         return await compressImage(uri, 800, 0.6);
  //       }),
  //     );

  //     // Convert to base64
  //     const base64Images = await Promise.all(
  //       compressedImages.map(async (uri) => {
  //         const base64 = await imageToBase64(uri);
  //         return base64;
  //       }),
  //     );

  //     // Send to backend
  //     const response =
  //       await repairService.autoFillRepairFromImages(base64Images);

  //     console.log("📥 AI response:", response);

  //     if (response.success && response.data) {
  //       const data = response.data;
  //       setAiExtractedData(data);

  //       // Auto-fill the form
  //       if (data.deviceType) {
  //         setSelectedDeviceType(data.deviceType);
  //         setRepairData((prev) => ({ ...prev, deviceType: data.deviceType }));
  //       }

  //       if (data.brand) {
  //         setRepairData((prev) => ({ ...prev, brand: data.brand }));
  //       }

  //       if (data.model) {
  //         setRepairData((prev) => ({ ...prev, model: data.model }));
  //       }

  //       if (data.serialNumber) {
  //         setRepairData((prev) => ({
  //           ...prev,
  //           serialNumber: data.serialNumber,
  //         }));
  //       }

  //       if (data.problemDescription) {
  //         setRepairData((prev) => ({
  //           ...prev,
  //           problemDescription: data.problemDescription,
  //         }));
  //       }

  //       if (data.estimatedCharges) {
  //         setRepairData((prev) => ({
  //           ...prev,
  //           charges: data.estimatedCharges.toString(),
  //         }));
  //       }

  //       if (data.deviceSpecs && Object.keys(data.deviceSpecs).length > 0) {
  //         setRepairData((prev) => ({
  //           ...prev,
  //           deviceSpecs: { ...prev.deviceSpecs, ...data.deviceSpecs },
  //         }));
  //       }

  //       // Show success message if we got meaningful data
  //       if (data.deviceType && data.deviceType !== "other") {
  //         console.log("✅ AI analysis successful!");
  //       } else {
  //         console.log("ℹ️ AI determined this is not a repair item");
  //       }

  //       // Keep modal open to show results
  //     } else {
  //       console.warn("⚠️ AI response had no data:", response);
  //       showAlert(
  //         "AI Analysis",
  //         "Could not extract repair details. Please fill manually.",
  //       );
  //       setShowAIModal(false);
  //     }
  //   } catch (error: any) {
  //     console.error("❌ Error auto-filling:", error);
  //     showAlert(
  //       "AI Analysis Failed",
  //       error.message ||
  //         "Failed to analyze images. Please fill details manually.",
  //     );
  //     setShowAIModal(false);
  //   } finally {
  //     setIsAutoFilling(false);
  //   }
  // };
  // apps/technician-app/src/screens/NewRepair.tsx

  // AI Auto-fill function - uses aiScanImages (temporary)
  const autoFillFromImages = async () => {
    if (!selectedDeviceTypeForAI) {
      showAlert(
        "Select Device Type",
        "Please select a device type before using AI auto-fill.",
      );
      return;
    }

    if (aiScanImages.length === 0) {
      showAlert(
        "No Images",
        "Please add at least one image to scan for auto-fill.",
      );
      return;
    }

    // Show loading modal
    setIsAutoFilling(true);
    setShowAIModal(true);

    try {
      console.log("🔄 Starting AI auto-fill process...");
console.log("📋 Loading device configuration...");
    const config = await DeviceConfigService.getDeviceTypeByName(
      selectedDeviceTypeForAI,
    );
    console.log("✅ Device config loaded:", config);
    
    // Store in state for later use
    setDeviceConfig(config);

      // Compress images
      const compressedImages = await Promise.all(
        aiScanImages.map(async (uri) => {
          return await compressImage(uri, 800, 0.6);
        }),
      );

      // Convert to base64
      const base64Images = await Promise.all(
        compressedImages.map(async (uri) => {
          const base64 = await imageToBase64(uri);
          return base64;
        }),
      );

      const payload = {
        images: base64Images,
        deviceType: deviceConfig,
      };
      console.log("Payload for AI auto-fill:", payload.deviceType);
      // Send to backend
      const response = await repairService.autoFillRepairFromImages(payload);

      console.log("📥 AI response:", response);

      if (response.success && response.data) {
        const data = response.data;
        console.log("✅ AI extracted data:", data);
        setAiExtractedData(data);

        // ============================================
        // ✅ MAP BACKEND DATA TO FRONTEND FIELDS
        // ============================================

        // 1. Device Type
        if (data.deviceType) {
          console.log(`📱 Setting device type: ${data.deviceType}`);
          setSelectedDeviceType(data.deviceType);
          setRepairData((prev) => ({
            ...prev,
            deviceType: data.deviceType,
          }));
        }

        // 2. Brand
        if (data.brand) {
          console.log(`🏷️ Setting brand: ${data.brand}`);
          setRepairData((prev) => ({
            ...prev,
            brand: data.brand,
          }));
        }

        // 3. Model
        if (data.model) {
          console.log(`📦 Setting model: ${data.model}`);
          setRepairData((prev) => ({
            ...prev,
            model: data.model,
          }));
        }

        // 4. Serial Number
        if (data.serialNumber) {
          console.log(`🔢 Setting serial number: ${data.serialNumber}`);
          setRepairData((prev) => ({
            ...prev,
            serialNumber: data.serialNumber,
          }));
        }

        // 5. Problem Description
        if (data.problemDescription) {
          console.log(
            `📝 Setting problem description: ${data.problemDescription}`,
          );
          setRepairData((prev) => ({
            ...prev,
            problemDescription: data.problemDescription,
          }));
        }

        // 6. Estimated Charges
        if (data.estimatedCharges) {
          console.log(`💰 Setting estimated charges: ${data.estimatedCharges}`);
          setRepairData((prev) => ({
            ...prev,
            charges: data.estimatedCharges.toString(),
          }));
        }

        // 7. Device Specifications - Map backend specs to frontend fields
        if (data.deviceSpecs && Object.keys(data.deviceSpecs).length > 0) {
          console.log("🔧 Setting device specifications:", data.deviceSpecs);

          // Get current specs
          const currentSpecs = repairData.deviceSpecs || {};

          // Map backend field names to frontend field names
          const specMapping: Record<string, string> = {
            // Motor specs
            motorType: "motorType",
            rpm: "rpm",
            speed: "rpm", // Alternative name
            voltage: "voltage",
            amps: "amps",
            hp: "hp",
            frequency: "frequency",
            coreLength: "coreLength",
            coreDiameter: "coreDiameter",
            slots: "slots",
            coils: "coils",
            wireGauge: "wireGauge",
            turnsPerCoil: "turnsPerCoil",
            weight: "weight",
            bearings: "bearings",
            power: "power", // kW
            efficiencyClass: "efficiencyClass",
            ipRating: "ipRating",
            phase: "phase",

            // AC specs
            acType: "acType",
            tonnage: "tonnage",
            refrigerant: "refrigerant",
            gasCharge: "gasCharge",
            compressorType: "compressorType",
            coilType: "coilType",
            compressorOil: "compressorOil",
            capacitor: "capacitor",

            // Refrigerator specs
            fridgeType: "fridgeType",
            capacity: "capacity",
            thermostat: "thermostat",

            // Washing Machine specs
            machineType: "machineType",
            // motorType: "motorType",
            beltType: "beltType",
            heatingElement: "heatingElement",

            // Water Pump specs
            pumpType: "pumpType",
            flowRate: "flowRate",
            headHeight: "headHeight",
          };

          // Create mapped specs object
          const mappedSpecs: any = { ...currentSpecs };

          // Loop through backend data and map to frontend fields
          for (const [backendKey, value] of Object.entries(data.deviceSpecs)) {
            // If value is not empty/null/undefined
            if (value !== null && value !== undefined && value !== "") {
              // Check if we have a mapping for this key
              if (specMapping[backendKey]) {
                const frontendKey = specMapping[backendKey];
                mappedSpecs[frontendKey] = value;
                console.log(
                  `  ✅ Mapped ${backendKey} → ${frontendKey}: ${value}`,
                );
              } else {
                // If no specific mapping, use the original key
                // But only if it doesn't conflict with existing fields
                if (!mappedSpecs[backendKey]) {
                  mappedSpecs[backendKey] = value;
                  console.log(`  ✅ Added ${backendKey}: ${value}`);
                }
              }
            }
          }

          // Update the specs
          setRepairData((prev) => ({
            ...prev,
            deviceSpecs: mappedSpecs,
          }));

          console.log("✅ Final mapped specs:", mappedSpecs);
        }

        // Show success message if we got meaningful data
        if (data.deviceType && data.deviceType !== "other") {
          console.log("✅ AI analysis successful!");

          // Show a success toast or alert
          const deviceName =
            DEVICE_TYPES.find((d) => d.id === data.deviceType)?.label ||
            data.deviceType;

          // You can show a success alert here if needed
          // showAlert(
          //   "AI Analysis Complete",
          //   `Successfully extracted ${deviceName} details. Please review the auto-filled fields.`
          // );
        } else {
          console.log("ℹ️ AI determined this is not a repair item");
        }

        // Keep modal open to show results
      } else {
        console.warn("⚠️ AI response had no data:", response);
        showAlert(
          "AI Analysis",
          "Could not extract repair details. Please fill manually.",
        );
        setShowAIModal(false);
      }
    } catch (error: any) {
      console.error("❌ Error auto-filling:", error);
      showAlert(
        "AI Analysis Failed",
        error.message ||
          "Failed to analyze images. Please fill details manually.",
      );
      setShowAIModal(false);
    } finally {
      setIsAutoFilling(false);
    }
  };
  // AI Scan Images functions
  const takeAiScanPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert("Camera Permission", "Please allow camera access.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setAiScanImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showAlert("Error", "Unable to open camera.");
    }
  };

  const pickAiScanImages = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert("Gallery Permission", "Please allow photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedImages = result.assets.map((asset) => asset.uri);
        setAiScanImages((prev) => [...prev, ...selectedImages]);
      }
    } catch (error) {
      console.error("Error selecting images:", error);
      showAlert("Error", "Unable to select images.");
    }
  };

  const removeAiScanImage = (index: number) => {
    setAiScanImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Repair Images functions (stored permanently)
  const takeRepairPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert("Camera Permission", "Please allow camera access.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setRepairImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showAlert("Error", "Unable to open camera.");
    }
  };

  const pickRepairImages = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert("Gallery Permission", "Please allow photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedImages = result.assets.map((asset) => asset.uri);
        setRepairImages((prev) => [...prev, ...selectedImages]);
      }
    } catch (error) {
      console.error("Error selecting images:", error);
      showAlert("Error", "Unable to select images.");
    }
  };

  const removeRepairImage = (index: number) => {
    setRepairImages((prev) => prev.filter((_, i) => i !== index));
  };

  const loadCustomer = async (id: string) => {
    try {
      const customerData = await CustomerService.getCustomerById(id);
      if (customerData) {
        setCustomer(customerData);
        setRepairData((prev) => ({
          ...prev,
          customerId: customerData.id,
          customerName: customerData.name,
          customerPhone: customerData.phone,
        }));
      }
    } catch (error) {
      console.error("Error loading customer:", error);
      showAlert("Error", "Failed to load customer data");
    }
  };

  const checkCustomerByPhone = async (phone: string) => {
    if (phone.length < 10) return;

    setCheckingPhone(true);
    try {
      const existingCustomer = await CustomerService.getCustomerByPhone(phone);

      if (existingCustomer) {
        setRepairData((prev) => ({
          ...prev,
          customerId: existingCustomer.id,
          customerName: existingCustomer.name,
          customerPhone: existingCustomer.phone,
        }));

        showAlert(
          "Customer Found",
          `Customer "${existingCustomer.name}" already exists. Using existing customer.`,
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Error checking customer:", error);
    } finally {
      setCheckingPhone(false);
    }
  };

  const handlePhoneChange = async (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    if (cleanPhone.length >= 10 && !repairData.customerId) {
      setRepairData((prev) => ({ ...prev, customerPhone: cleanPhone }));
      await checkCustomerByPhone(cleanPhone);
    } else {
      setRepairData((prev) => ({ ...prev, customerPhone: cleanPhone }));
    }
  };

  const handleSubmit = async () => {
    if (!repairData.customerName || !repairData.customerPhone) {
      showAlert("Error", "Please enter customer name and phone number");
      return;
    }

    if (!repairData.deviceType) {
      showAlert("Error", "Please select a device type");
      return;
    }

    if (!repairData.problemDescription) {
      showAlert("Error", "Please describe the problem");
      return;
    }

    setLoading(true);
    try {
      // Process all images (compress and resize)
      const processedImages = await Promise.all(
        repairImages.map(async (uri) => {
          const processed = await processImage(uri);
          return processed.uri;
        }),
      );
      const formData = new FormData();
      formData.append("customerID", repairData.customerId);
      formData.append("customerName", repairData.customerName);
      formData.append("customerPhone", repairData.customerPhone);
      formData.append("deviceType", repairData.deviceType);
      formData.append("brand", repairData.brand || "");
      formData.append("model", repairData.model || "");
      formData.append("serialNumber", repairData.serialNumber || "");
      formData.append("problemDescription", repairData.problemDescription);
      formData.append("status", repairData.status);
      formData.append("charges", repairData.charges || "0");
      formData.append("estimatedDays", repairData.estimatedDays || "");
      formData.append(
        "deviceSpecs",
        JSON.stringify(repairData.deviceSpecs || {}),
      );
      console.log("Appending images:", processedImages);
      // processedImages.forEach((uri, index) => {
      //   // Get filename from URI
      //   const filename = uri.split("/").pop() || `image_${index}.jpg`;

      //   // Determine mime type
      //   let mimeType = "image/jpeg";
      //   if (uri.endsWith(".png")) mimeType = "image/png";
      //   else if (uri.endsWith(".webp")) mimeType = "image/webp";
      //   else if (uri.startsWith("data:image")) {
      //     // Extract mime type from data URL
      //     const match = uri.match(/^data:image\/(\w+);base64,/);
      //     if (match) {
      //       mimeType = `image/${match[1]}`;
      //     }
      //   }

      //   const fileObject = {
      //     uri: uri,
      //     type: mimeType,
      //     name: filename,
      //   };

      //   console.log(`Adding file ${index}:`, fileObject);
      //   formData.append("images", fileObject as any);
      // });
      for (let index = 0; index < processedImages.length; index++) {
        const uri = processedImages[index];

        console.log(`Processing image ${index}:`, uri);

        try {
          const imageResponse = await fetch(uri);

          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }

          const blob = await imageResponse.blob();

          console.log(`Image ${index} blob:`, {
            type: blob.type,
            size: blob.size,
          });

          let extension = "jpg";

          if (blob.type === "image/png") {
            extension = "png";
          } else if (blob.type === "image/webp") {
            extension = "webp";
          }

          const filename = `repair-image-${Date.now()}-${index}.${extension}`;

          formData.append("images", blob, filename);

          console.log(`Added image ${index}:`, {
            filename,
            type: blob.type,
            size: blob.size,
          });
        } catch (error) {
          console.error(`Failed to process image ${index}:`, error);
        }
      }

      // Debug: Log form data entries
      console.log(
        "FormData entries: ____________________________________________________________________________________________________",
        formData,
      );
      const response = await repairService.createRepairWithImages(formData);
      console.log("response creating repair", response);
      addRepair(response);

      setCreatedRepair(response);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error saving repair:", error);
      showAlert("Error", error.message || "Failed to create repair job");
    } finally {
      setLoading(false);
    }
  };

  const renderDeviceTypeSelector = () => {
    return (
      <View style={styles.deviceTypeContainer}>
        <Text style={styles.label}>Device Type *</Text>
        <View style={styles.deviceTypeGrid}>
          {deviceTypes.map((type) => {
            const isActive = selectedDeviceType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.deviceTypeCard,
                  isActive && styles.deviceTypeCardActive,
                ]}
                onPress={() => {
                  setSelectedDeviceType(type.id);
                  setSelectedDeviceTypeForAI(type.id); // ✅ Store for AI
                  setRepairData((prev) => ({ ...prev, deviceType: type.id }));
                }}
              >
                <Text style={styles.deviceTypeIcon}>
                  {String(type.icon || "")}
                </Text>
                <Text
                  style={[
                    styles.deviceTypeLabel,
                    isActive && styles.deviceTypeLabelActive,
                  ]}
                >
                  {String(type.label || "")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDeviceSpecs = () => {
    if (!selectedDeviceType) {
      return null;
    }

    return (
      <DynamicDeviceSpecsForm
        deviceType={selectedDeviceType}
        specs={repairData.deviceSpecs || {}}
        onSpecsChange={(specs) => {
          setRepairData((prev) => ({ ...prev, deviceSpecs: specs || {} }));
        }}
      />
    );
  };

  // AI Auto-fill modal
  // AI Auto-fill modal
  const renderAIModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAIModal}
      onRequestClose={() => setShowAIModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>AI Analysis</Text>

          {isAutoFilling ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.modalLoadingText}>
                Analyzing images with AI...
              </Text>
              <Text style={styles.modalLoadingSubtext}>
                Please wait while we extract repair details
              </Text>
            </View>
          ) : aiExtractedData ? (
            <View style={styles.modalResultContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
              <Text style={styles.modalResultTitle}>Analysis Complete</Text>

              <ScrollView style={styles.modalResultScroll}>
                <View style={styles.modalResultGrid}>
                  {/* Device Type */}
                  {aiExtractedData.deviceType && (
                    <View style={styles.modalResultItem}>
                      <Text style={styles.modalResultLabel}>Device</Text>
                      <Text style={styles.modalResultValue}>
                        {DEVICE_TYPES.find(
                          (d) => d.id === aiExtractedData.deviceType,
                        )?.label || aiExtractedData.deviceType}
                      </Text>
                    </View>
                  )}

                  {/* Brand */}
                  {aiExtractedData.brand && (
                    <View style={styles.modalResultItem}>
                      <Text style={styles.modalResultLabel}>Brand</Text>
                      <Text style={styles.modalResultValue}>
                        {aiExtractedData.brand}
                      </Text>
                    </View>
                  )}

                  {/* Model */}
                  {aiExtractedData.model && (
                    <View style={styles.modalResultItem}>
                      <Text style={styles.modalResultLabel}>Model</Text>
                      <Text style={styles.modalResultValue}>
                        {aiExtractedData.model}
                      </Text>
                    </View>
                  )}

                  {/* Serial Number */}
                  {aiExtractedData.serialNumber && (
                    <View style={styles.modalResultItem}>
                      <Text style={styles.modalResultLabel}>Serial No.</Text>
                      <Text style={styles.modalResultValue}>
                        {aiExtractedData.serialNumber}
                      </Text>
                    </View>
                  )}

                  {/* Problem Description */}
                  {aiExtractedData.problemDescription && (
                    <View style={styles.modalResultItem}>
                      <Text style={styles.modalResultLabel}>Problem</Text>
                      <Text
                        style={[
                          styles.modalResultValue,
                          styles.modalResultMultiline,
                        ]}
                      >
                        {aiExtractedData.problemDescription}
                      </Text>
                    </View>
                  )}

                  {/* Estimated Charges */}
                  {aiExtractedData.estimatedCharges && (
                    <View style={styles.modalResultItem}>
                      <Text style={styles.modalResultLabel}>Est. Charges</Text>
                      <Text style={styles.modalResultValue}>
                        ₹{aiExtractedData.estimatedCharges}
                      </Text>
                    </View>
                  )}

                  {/* Device Specs - Show all extracted specs */}
                  {aiExtractedData.deviceSpecs &&
                    Object.keys(aiExtractedData.deviceSpecs).length > 0 && (
                      <View style={styles.modalSpecsContainer}>
                        <Text style={styles.modalSpecsTitle}>
                          📋 Specifications
                        </Text>
                        {Object.entries(aiExtractedData.deviceSpecs).map(
                          ([key, value]) => {
                            // Format the key name for display
                            const displayKey = key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase());

                            return (
                              <View key={key} style={styles.modalSpecItem}>
                                <Text style={styles.modalSpecLabel}>
                                  {displayKey}
                                </Text>
                                <Text style={styles.modalSpecValue}>
                                  {String(value)}
                                </Text>
                              </View>
                            );
                          },
                        )}
                      </View>
                    )}
                </View>
              </ScrollView>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowAIModal(false)}
          >
            <Text style={styles.modalButtonText}>Apply & Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Repair Job</Text>
      </View>
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#059669" />
            </View>

            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalMessage}>
              Repair job has been created successfully.
            </Text>

            {/* Repair ID or Summary */}
            {createdRepair?._id && (
              <View style={styles.repairIdContainer}>
                <Text style={styles.repairIdLabel}>Repair ID:</Text>
                <Text style={styles.repairIdValue}>
                  {createdRepair._id.slice(0, 8)}...
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.successModalButtons}>
              <TouchableOpacity
                style={[
                  styles.successModalButton,
                  styles.successModalButtonPrimary,
                ]}
                // onPress={() => {
                //   setShowSuccessModal(false);
                //   navigation.navigate("RepairDetail", {
                //     repairId: createdRepair?._id,
                //   });
                // }}
                onPress={() => {
                  setShowSuccessModal(false);
                  if (createdRepair?._id) {
                    navigation.navigate("RepairDetail", {
                      repairId: createdRepair._id,
                    });
                  } else {
                    navigation.goBack();
                  }
                }}
              >
                <Text style={styles.successModalButtonText}>View Repair</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.successModalButton,
                  styles.successModalButtonSecondary,
                ]}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.successModalButtonTextSecondary}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>

          {repairData.customerId && repairData.customerName ? (
            <View style={styles.existingCustomerBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.existingCustomerText}>
                Existing Customer: {String(repairData.customerName)}
              </Text>
            </View>
          ) : null}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer name"
              value={repairData.customerName}
              onChangeText={(text) =>
                setRepairData((prev) => ({ ...prev, customerName: text }))
              }
              editable={!customerId}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="Enter phone number"
                value={repairData.customerPhone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                editable={!customerId}
                maxLength={12}
              />
              {checkingPhone ? (
                <View style={styles.phoneSpinnerContainer}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                </View>
              ) : null}
            </View>
          </View>

          {!customerId ? (
            <TouchableOpacity
              style={styles.searchCustomerBtn}
              onPress={() => navigation.navigate("CustomerSearch" as never)}
            >
              <Ionicons name="search-outline" size={20} color="#4F46E5" />
              <Text style={styles.searchCustomerText}>
                Search Existing Customer
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Device Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          {renderDeviceTypeSelector()}
        </View>

        {/* AI SCAN SECTION - Images for AI auto-fill (not stored) */}
        <View style={[styles.section, styles.aiScanSection]}>
          <View style={styles.imageSectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="scan-outline" size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>AI Scan</Text>
            </View>
            {aiScanImages.length > 0 && (
              <TouchableOpacity
                // style={styles.aiButton}
                // onPress={autoFillFromImages}
                // disabled={isAutoFilling}
                style={[
                  styles.aiButton,
                  // ✅ Disable if no device type selected
                  !selectedDeviceTypeForAI && styles.aiButtonDisabled,
                ]}
                onPress={autoFillFromImages}
                disabled={isAutoFilling || !selectedDeviceTypeForAI}
              >
                {isAutoFilling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.aiButtonText}>Auto-Fill</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          {aiScanImages.length > 0 && !selectedDeviceTypeForAI && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={16} color="#D97706" />
              <Text style={styles.warningText}>
                Please select a device type above before using AI Auto-Fill
              </Text>
            </View>
          )}

          <Text style={styles.imageDescription}>
            Upload images to scan and auto-fill repair details. Images won't be
            stored.
          </Text>

          <Text style={styles.imageDescription}>
            Upload images to scan and auto-fill repair details. Images won't be
            stored.
          </Text>

          <View style={styles.imageActionRow}>
            <TouchableOpacity
              style={[styles.imageActionButton, styles.aiScanButton]}
              onPress={takeAiScanPhoto}
            >
              <Ionicons name="camera-outline" size={24} color="#7C3AED" />
              <Text style={[styles.imageActionText, styles.aiScanText]}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageActionButton, styles.aiScanButton]}
              onPress={pickAiScanImages}
            >
              <Ionicons name="images-outline" size={24} color="#7C3AED" />
              <Text style={[styles.imageActionText, styles.aiScanText]}>
                Gallery
              </Text>
            </TouchableOpacity>
          </View>

          {aiScanImages.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              {aiScanImages.map((uri, index) => (
                <View
                  key={`scan-${uri}-${index}`}
                  style={styles.imagePreviewWrapper}
                >
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeAiScanImage(index)}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {renderAIModal()}

        {/* Device Details */}
        <View style={styles.section}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., LG, Samsung, Crompton"
              value={repairData.brand}
              onChangeText={(text) =>
                setRepairData((prev) => ({ ...prev, brand: text }))
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter model number"
              value={repairData.model}
              onChangeText={(text) =>
                setRepairData((prev) => ({ ...prev, model: text }))
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Serial Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter serial number"
              value={repairData.serialNumber}
              onChangeText={(text) =>
                setRepairData((prev) => ({ ...prev, serialNumber: text }))
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Problem Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the problem in detail"
              value={repairData.problemDescription}
              onChangeText={(text) =>
                setRepairData((prev) => ({ ...prev, problemDescription: text }))
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Device Specifications */}
        {renderDeviceSpecs()}

        {/* Repair Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repair Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Estimated Charges (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1500"
              value={repairData.charges}
              onChangeText={(text) =>
                setRepairData((prev) => ({ ...prev, charges: text }))
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Estimated Days</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2-3 days"
              value={repairData.estimatedDays}
              onChangeText={(text) =>
                setRepairData((prev) => ({ ...prev, estimatedDays: text }))
              }
            />
          </View>
        </View>

        {/* REPAIR IMAGES SECTION - Stored with repair */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repair Images</Text>

          <Text style={styles.imageDescription}>
            Add photos of the device, damage, or other repair details. These
            will be stored with the repair.
          </Text>

          <View style={styles.imageActionRow}>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={takeRepairPhoto}
            >
              <Ionicons name="camera-outline" size={24} color="#4F46E5" />
              <Text style={styles.imageActionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={pickRepairImages}
            >
              <Ionicons name="images-outline" size={24} color="#4F46E5" />
              <Text style={styles.imageActionText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {repairImages.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              {repairImages.map((uri, index) => (
                <View
                  key={`repair-${uri}-${index}`}
                  style={styles.imagePreviewWrapper}
                >
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeRepairImage(index)}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading ? styles.submitBtnDisabled : null]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Repair Job</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  aiButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#9CA3AF",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#92400E",
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#4F46E5",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  aiScanSection: {
    borderWidth: 1,
    borderColor: "#C4B5FD",
    backgroundColor: "#FAF5FF",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 0,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  deviceTypeContainer: {
    marginBottom: 8,
  },
  deviceTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  deviceTypeCard: {
    flex: 1,
    minWidth: "30%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  deviceTypeCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  deviceTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  deviceTypeLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  deviceTypeLabelActive: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  searchCustomerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#4F46E5",
    borderRadius: 12,
    borderStyle: "dashed",
    gap: 8,
  },
  searchCustomerText: {
    color: "#4F46E5",
    fontWeight: "500",
  },
  submitBtn: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  existingCustomerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  existingCustomerText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
  },
  phoneInputContainer: {
    position: "relative",
  },
  phoneInput: {
    paddingRight: 40,
  },
  phoneSpinnerContainer: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  imageDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  imageActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  imageActionButton: {
    flex: 1,
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  aiScanButton: {
    borderColor: "#C4B5FD",
    backgroundColor: "#F5F3FF",
  },
  imageActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  aiScanText: {
    color: "#7C3AED",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
  },
  imagePreviewWrapper: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 20,
  },
  modalLoadingContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  modalLoadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginTop: 16,
  },
  modalLoadingSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  modalResultContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  modalResultTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#059669",
    marginTop: 8,
    marginBottom: 16,
  },
  modalResultGrid: {
    width: "100%",
    gap: 8,
  },
  modalResultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalResultLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  modalResultValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  modalButton: {
    backgroundColor: "#4F46E5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Add these styles to your StyleSheet
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 8,
  },
  repairIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  repairIdLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  repairIdValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  successModalButtons: {
    width: "100%",
    gap: 12,
  },
  successModalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  successModalButtonPrimary: {
    backgroundColor: "#4F46E5",
  },
  successModalButtonSecondary: {
    backgroundColor: "#F1F5F9",
  },
  successModalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  successModalButtonTextSecondary: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "600",
  },
  modalResultScroll: {
    maxHeight: 400,
    width: "100%",
  },
  modalResultMultiline: {
    flex: 1,
    flexWrap: "wrap",
    fontSize: 13,
  },
  modalSpecsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    width: "100%",
  },
  modalSpecsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },
  modalSpecItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalSpecLabel: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  modalSpecValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0F172A",
    flex: 1,
    textAlign: "right",
  },
});
