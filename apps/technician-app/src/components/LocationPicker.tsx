// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Modal,
//   Alert,
//   Platform,
//   ActivityIndicator,
//   TextInput,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import * as Location from 'expo-location';

// // IMPORTANT: Conditionally import react-native-maps only on mobile
// let MapView: any = null;
// let Marker: any = null;
// let PROVIDER_GOOGLE: any = null;

// if (Platform.OS !== 'web') {
//   try {
//     const Maps = require('react-native-maps');
//     MapView = Maps.default || Maps;
//     Marker = Maps.Marker;
//     PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
//   } catch (error) {
//     console.warn('React Native Maps not available:', error);
//   }
// }

// interface LocationPickerProps {
//   onLocationSelect: (location: {
//     address: string;
//     lat: number;
//     lng: number;
//   }) => void;
//   initialLocation?: {
//     address: string;
//     lat: number;
//     lng: number;
//   };
// }

// export default function LocationPicker({ 
//   onLocationSelect, 
//   initialLocation 
// }: LocationPickerProps) {
//   const [modalVisible, setModalVisible] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [location, setLocation] = useState<{
//     address: string;
//     lat: number;
//     lng: number;
//   }>({
//     address: initialLocation?.address || '',
//     lat: initialLocation?.lat || 14.6819,
//     lng: initialLocation?.lng || 77.6006,
//   });
//   const [selectedLat, setSelectedLat] = useState(initialLocation?.lat || 14.6819);
//   const [selectedLng, setSelectedLng] = useState(initialLocation?.lng || 77.6006);
//   const [searchAddress, setSearchAddress] = useState('');
//   const [region, setRegion] = useState({
//     latitude: initialLocation?.lat || 14.6819,
//     longitude: initialLocation?.lng || 77.6006,
//     latitudeDelta: 0.0922,
//     longitudeDelta: 0.0421,
//   });

//   useEffect(() => {
//     if (initialLocation) {
//       setLocation(initialLocation);
//       setSelectedLat(initialLocation.lat);
//       setSelectedLng(initialLocation.lng);
//       setRegion({
//         latitude: initialLocation.lat,
//         longitude: initialLocation.lng,
//         latitudeDelta: 0.0922,
//         longitudeDelta: 0.0421,
//       });
//     }
//   }, [initialLocation]);

// //   const getCurrentLocation = async () => {
// //     try {
// //       setLoading(true);
// //       const { status } = await Location.requestForegroundPermissionsAsync();
      
// //       if (status !== 'granted') {
// //         Alert.alert('Permission Denied', 'Please allow location access');
// //         return;
// //       }

// //       const currentLocation = await Location.getCurrentPositionAsync({
// //         accuracy: Location.Accuracy.High,
// //       });

// //       const { latitude, longitude } = currentLocation.coords;
// //       const address = await reverseGeocode(latitude, longitude);
      
// //       const locationData = { address, lat: latitude, lng: longitude };
// //       setLocation(locationData);
// //       setSelectedLat(latitude);
// //       setSelectedLng(longitude);
// //       setRegion({
// //         latitude,
// //         longitude,
// //         latitudeDelta: 0.0922,
// //         longitudeDelta: 0.0421,
// //       });
// //       onLocationSelect(locationData);
      
// //       Alert.alert('Success', 'Current location updated!');
// //     } catch (error) {
// //       Alert.alert('Error', 'Failed to get current location');
// //       console.error(error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };
// const getCurrentLocation = async () => {
//   try {
//     setLoading(true);
    
//     // Check if we're on web
//     if (Platform.OS === 'web') {
//       // Web Geolocation API
//       if (!navigator.geolocation) {
//         Alert.alert('Error', 'Geolocation is not supported by your browser');
//         setLoading(false);
//         return;
//       }

//       // Get position using browser's Geolocation API
//       const position = await new Promise<GeolocationPosition>((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 0,
//         });
//       });

//       const { latitude, longitude } = position.coords;
//       const address = await reverseGeocode(latitude, longitude);
      
//       const locationData = { address, lat: latitude, lng: longitude };
//       setLocation(locationData);
//       setSelectedLat(latitude);
//       setSelectedLng(longitude);
//       if (Platform.OS !== 'web') {
//         setRegion({
//           latitude,
//           longitude,
//           latitudeDelta: 0.0922,
//           longitudeDelta: 0.0421,
//         });
//       }
//       onLocationSelect(locationData);
      
//       Alert.alert('Success', 'Current location updated!');
//       setLoading(false);
//       return;
//     }

//     // Mobile: Use Expo Location
//     const { status } = await Location.requestForegroundPermissionsAsync();
    
//     if (status !== 'granted') {
//       Alert.alert('Permission Denied', 'Please allow location access');
//       setLoading(false);
//       return;
//     }

//     const currentLocation = await Location.getCurrentPositionAsync({
//       accuracy: Location.Accuracy.High,
//     });

//     const { latitude, longitude } = currentLocation.coords;
//     const address = await reverseGeocode(latitude, longitude);
    
//     const locationData = { address, lat: latitude, lng: longitude };
//     setLocation(locationData);
//     setSelectedLat(latitude);
//     setSelectedLng(longitude);
//     setRegion({
//       latitude,
//       longitude,
//       latitudeDelta: 0.0922,
//       longitudeDelta: 0.0421,
//     });
//     onLocationSelect(locationData);
    
//     Alert.alert('Success', 'Current location updated!');
//   } catch (error: any) {
//     console.error('Location error:', error);
    
//     // Provide user-friendly error messages
//     let errorMessage = 'Failed to get current location. ';
//     if (error.code === 1) {
//       errorMessage += 'Please allow location access in your browser settings.';
//     } else if (error.code === 2) {
//       errorMessage += 'Location unavailable. Please check your connection.';
//     } else if (error.code === 3) {
//       errorMessage += 'Location request timed out. Please try again.';
//     } else {
//       errorMessage += 'Please try again or enter coordinates manually.';
//     }
    
//     Alert.alert('Error', errorMessage);
//   } finally {
//     setLoading(false);
//   }
// };

//   const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
//     try {
//       const address = await Location.reverseGeocodeAsync({
//         latitude: lat,
//         longitude: lng,
//       });
      
//       if (address.length > 0) {
//         const addr = address[0];
//         return `${addr.name || ''}, ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.country || ''}`;
//       }
//       return 'Address not found';
//     } catch (error) {
//       return 'Address not found';
//     }
//   };

//   const searchLocation = async () => {
//     if (!searchAddress.trim()) {
//       Alert.alert('Error', 'Please enter an address');
//       return;
//     }

//     try {
//       setLoading(true);
//       const results = await Location.geocodeAsync(searchAddress);
      
//       if (results.length > 0) {
//         const { latitude, longitude } = results[0];
//         const address = await reverseGeocode(latitude, longitude);
        
//         setSelectedLat(latitude);
//         setSelectedLng(longitude);
//         setLocation({ address, lat: latitude, lng: longitude });
//         setRegion({
//           latitude,
//           longitude,
//           latitudeDelta: 0.0922,
//           longitudeDelta: 0.0421,
//         });
//         onLocationSelect({ address, lat: latitude, lng: longitude });
//       } else {
//         Alert.alert('Not Found', 'Location not found');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to search location');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleConfirmLocation = () => {
//     if (selectedLat === 0 || selectedLng === 0) {
//       Alert.alert('Error', 'Please select a location');
//       return;
//     }
//     onLocationSelect({
//       address: location.address || `Lat: ${selectedLat}, Lng: ${selectedLng}`,
//       lat: selectedLat,
//       lng: selectedLng,
//     });
//     setModalVisible(false);
//   };

//   const handleMapPress = (e: any) => {
//     if (Platform.OS === 'web') return;
//     const { latitude, longitude } = e.nativeEvent.coordinate;
//     setSelectedLat(latitude);
//     setSelectedLng(longitude);
//     reverseGeocode(latitude, longitude).then(address => {
//       setLocation({
//         address,
//         lat: latitude,
//         lng: longitude,
//       });
//     });
//   };

//   // Render Mobile Map
//   const renderMobileMap = () => {
//     if (Platform.OS === 'web' || !MapView) {
//       return renderWebFallback();
//     }

//     return (
//       <MapView
//         provider={PROVIDER_GOOGLE}
//         style={styles.map}
//         region={region}
//         onRegionChangeComplete={(newRegion: any) => setRegion(newRegion)}
//         onPress={handleMapPress}
//         showsUserLocation={true}
//         showsMyLocationButton={true}
//       >
//         <Marker
//           coordinate={{
//             latitude: selectedLat,
//             longitude: selectedLng,
//           }}
//           draggable
//           onDragEnd={(e: any) => {
//             const { latitude, longitude } = e.nativeEvent.coordinate;
//             setSelectedLat(latitude);
//             setSelectedLng(longitude);
//             reverseGeocode(latitude, longitude).then(address => {
//               setLocation({
//                 address,
//                 lat: latitude,
//                 lng: longitude,
//               });
//             });
//           }}
//           title="Selected Location"
//           description={location.address}
//         />
//       </MapView>
//     );
//   };

//   // Render Web Fallback
//   const renderWebFallback = () => {
//     return (
//       <View style={styles.webContainer}>
//         <View style={styles.webMapPlaceholder}>
//           <Ionicons name="location-outline" size={80} color="#ccc" />
//           <Text style={styles.webMapTitle}>Select Location</Text>
//           <Text style={styles.webMapSubtitle}>
//             Enter coordinates manually or use "Get Current Location"
//           </Text>
          
//           <View style={styles.webCoordinatesContainer}>
//             <View style={styles.webCoordinateInput}>
//               <Text style={styles.webCoordinateLabel}>Latitude</Text>
//               <TextInput
//                 style={styles.webCoordinateInputField}
//                 value={selectedLat.toString()}
//                 onChangeText={(text) => {
//                   const num = parseFloat(text);
//                   if (!isNaN(num)) {
//                     setSelectedLat(num);
//                     setLocation({ ...location, lat: num });
//                   }
//                 }}
//                 keyboardType="decimal-pad"
//                 placeholder="Enter latitude"
//               />
//             </View>
//             <View style={styles.webCoordinateInput}>
//               <Text style={styles.webCoordinateLabel}>Longitude</Text>
//               <TextInput
//                 style={styles.webCoordinateInputField}
//                 value={selectedLng.toString()}
//                 onChangeText={(text) => {
//                   const num = parseFloat(text);
//                   if (!isNaN(num)) {
//                     setSelectedLng(num);
//                     setLocation({ ...location, lng: num });
//                   }
//                 }}
//                 keyboardType="decimal-pad"
//                 placeholder="Enter longitude"
//               />
//             </View>
//           </View>

//           <TouchableOpacity
//             style={styles.webGetLocationButton}
//             onPress={getCurrentLocation}
//           >
//             <Ionicons name="locate" size={20} color="#fff" />
//             <Text style={styles.webGetLocationText}>Get Current Location</Text>
//           </TouchableOpacity>

//           <Text style={styles.webMapNote}>
//             Interactive map is available on mobile devices
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <View>
//       <TouchableOpacity
//         style={styles.locationPicker}
//         onPress={() => setModalVisible(true)}
//       >
//         <View style={styles.locationDisplay}>
//           <Ionicons name="location-outline" size={24} color="#4F46E5" />
//           <View style={styles.locationTextContainer}>
//             <Text style={styles.locationLabel}>Location</Text>
//             <Text style={styles.locationAddress} numberOfLines={1}>
//               {location.address || 'Tap to select location'}
//             </Text>
//           </View>
//           <Ionicons name="chevron-forward" size={24} color="#999" />
//         </View>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.currentLocationButton}
//         onPress={getCurrentLocation}
//         disabled={loading}
//       >
//         {loading ? (
//           <ActivityIndicator size="small" color="#4F46E5" />
//         ) : (
//           <>
//             <Ionicons name="locate" size={20} color="#4F46E5" />
//             <Text style={styles.currentLocationText}>Get Current Location</Text>
//           </>
//         )}
//       </TouchableOpacity>

//       <Modal
//         animationType="slide"
//         transparent={false}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <TouchableOpacity onPress={() => setModalVisible(false)}>
//               <Text style={styles.modalCancel}>Cancel</Text>
//             </TouchableOpacity>
//             <Text style={styles.modalTitle}>Select Location</Text>
//             <TouchableOpacity onPress={handleConfirmLocation}>
//               <Text style={styles.modalConfirm}>Confirm</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.searchContainer}>
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search address..."
//               value={searchAddress}
//               onChangeText={setSearchAddress}
//               onSubmitEditing={searchLocation}
//             />
//             <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
//               <Ionicons name="search" size={24} color="#fff" />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.mapContainer}>
//             {renderMobileMap()}
//           </View>

//           {location.address && (
//             <View style={styles.selectedLocationInfo}>
//               <Ionicons name="location-sharp" size={24} color="#4F46E5" />
//               <Text style={styles.selectedLocationText} numberOfLines={2}>
//                 {location.address}
//               </Text>
//             </View>
//           )}
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   locationPicker: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 12,
//     padding: 14,
//     backgroundColor: '#fafafa',
//   },
//   locationDisplay: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   locationTextContainer: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   locationLabel: {
//     fontSize: 12,
//     color: '#666',
//     fontWeight: '500',
//   },
//   locationAddress: {
//     fontSize: 16,
//     color: '#333',
//     marginTop: 2,
//   },
//   currentLocationButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 8,
//     paddingVertical: 8,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 8,
//   },
//   currentLocationText: {
//     marginLeft: 8,
//     color: '#4F46E5',
//     fontWeight: '500',
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     paddingTop: Platform.OS === 'ios' ? 50 : 16,
//   },
//   modalCancel: {
//     fontSize: 16,
//     color: '#666',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   modalConfirm: {
//     fontSize: 16,
//     color: '#4F46E5',
//     fontWeight: 'bold',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     padding: 16,
//     backgroundColor: '#f5f5f5',
//   },
//   searchInput: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     marginRight: 8,
//   },
//   searchButton: {
//     backgroundColor: '#4F46E5',
//     borderRadius: 8,
//     padding: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   mapContainer: {
//     flex: 1,
//   },
//   map: {
//     flex: 1,
//   },
//   webContainer: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   webMapPlaceholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#f5f5f5',
//   },
//   webMapTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 20,
//   },
//   webMapSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   webCoordinatesContainer: {
//     width: '100%',
//     maxWidth: 400,
//     marginTop: 20,
//   },
//   webCoordinateInput: {
//     marginBottom: 12,
//   },
//   webCoordinateLabel: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 4,
//   },
//   webCoordinateInputField: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 10,
//     backgroundColor: '#fff',
//     fontSize: 16,
//   },
//   webGetLocationButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 20,
//     backgroundColor: '#4F46E5',
//     paddingHorizontal: 30,
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   webGetLocationText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   webMapNote: {
//     marginTop: 16,
//     fontSize: 12,
//     color: '#999',
//     textAlign: 'center',
//   },
//   selectedLocationInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: '#f5f5f5',
//     borderTopWidth: 1,
//     borderTopColor: '#ddd',
//   },
//   selectedLocationText: {
//     flex: 1,
//     marginLeft: 12,
//     fontSize: 14,
//     color: '#333',
//   },
// });

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Conditionally import react-native-maps only on mobile
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (error) {
    console.warn('React Native Maps not available:', error);
  }
}

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  initialLocation?: {
    address: string;
    lat: number;
    lng: number;
  };
}

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation 
}: LocationPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
  }>({
    address: initialLocation?.address || '',
    lat: initialLocation?.lat || 14.6819,
    lng: initialLocation?.lng || 77.6006,
  });
  const [selectedLat, setSelectedLat] = useState(initialLocation?.lat || 14.6819);
  const [selectedLng, setSelectedLng] = useState(initialLocation?.lng || 77.6006);
  const [searchAddress, setSearchAddress] = useState('');
  const [region, setRegion] = useState({
    latitude: initialLocation?.lat || 14.6819,
    longitude: initialLocation?.lng || 77.6006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
      setSelectedLat(initialLocation.lat);
      setSelectedLng(initialLocation.lng);
      setRegion({
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [initialLocation]);

  // Get current location - works on both web and mobile
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // WEB: Use browser's Geolocation API
      if (Platform.OS === 'web') {
        // Check if geolocation is available
        if (!navigator.geolocation) {
          Alert.alert(
            'Not Supported', 
            'Geolocation is not supported by your browser. Please enter coordinates manually.'
          );
          setLoading(false);
          return;
        }

        // Get position with a promise
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve, 
              (error) => {
                // Create a more descriptive error
                let message = 'Unknown error';
                switch(error.code) {
                  case 1:
                    message = 'Location permission denied. Please allow location access in your browser.';
                    break;
                  case 2:
                    message = 'Location unavailable. Please check your internet connection.';
                    break;
                  case 3:
                    message = 'Location request timed out. Please try again.';
                    break;
                  default:
                    message = error.message || 'Failed to get location';
                }
                reject(new Error(message));
              },
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
              }
            );
          });

          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          
          const locationData = { address, lat: latitude, lng: longitude };
          setLocation(locationData);
          setSelectedLat(latitude);
          setSelectedLng(longitude);
          onLocationSelect(locationData);
          
          Alert.alert('Success', 'Current location updated!');
          setLoading(false);
          return;
        } catch (error: any) {
          // Handle geolocation errors
          Alert.alert(
            'Location Error',
            error.message || 'Failed to get your location. Please enter coordinates manually.'
          );
          setLoading(false);
          return;
        }
      }

      // MOBILE: Use Expo Location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;
      const address = await reverseGeocode(latitude, longitude);
      
      const locationData = { address, lat: latitude, lng: longitude };
      setLocation(locationData);
      setSelectedLat(latitude);
      setSelectedLng(longitude);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      onLocationSelect(locationData);
      
      Alert.alert('Success', 'Current location updated!');
    } catch (error: any) {
      console.warn('Location error:', error);
      
      // User-friendly error messages for mobile
      let errorMessage = 'Could not get your location. ';
      
      if (error.code === 'E_LOCATION_UNAUTHORIZED') {
        errorMessage += 'Please enable location permissions in your device settings.';
      } else if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage += 'Request timed out. Please try again.';
      } else {
        errorMessage += 'Please try again or enter coordinates manually.';
      }
      
      Alert.alert('Location Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reverse geocoding - works on both platforms
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // WEB: Use OpenStreetMap Nominatim (free, no API key needed)
      if (Platform.OS === 'web') {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'TechnicianApp/1.0'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              return data.display_name;
            }
          }
        } catch (e) {
          console.warn('OpenStreetMap reverse geocoding failed:', e);
        }
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }

      // MOBILE: Use Expo Location
      const address = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      
      if (address && address.length > 0) {
        const addr = address[0];
        const parts = [
          addr.name,
          addr.street,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean);
        return parts.join(', ') || 'Address found';
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Search location
  const searchLocation = async () => {
    if (!searchAddress.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    try {
      setLoading(true);
      
      // WEB: Use OpenStreetMap Nominatim
      if (Platform.OS === 'web') {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`,
            {
              headers: {
                'User-Agent': 'TechnicianApp/1.0'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            
            if (data && data.length > 0) {
              const { lat, lon } = data[0];
              const latitude = parseFloat(lat);
              const longitude = parseFloat(lon);
              const address = await reverseGeocode(latitude, longitude);
              
              setSelectedLat(latitude);
              setSelectedLng(longitude);
              setLocation({ address, lat: latitude, lng: longitude });
              onLocationSelect({ address, lat: latitude, lng: longitude });
              Alert.alert('Success', 'Location found!');
            } else {
              Alert.alert('Not Found', 'No location found for this address');
            }
          } else {
            Alert.alert('Error', 'Search service unavailable');
          }
        } catch (e) {
          Alert.alert('Error', 'Failed to search location');
        }
        setLoading(false);
        return;
      }

      // MOBILE: Use Expo Location
      const results = await Location.geocodeAsync(searchAddress);
      
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        const address = await reverseGeocode(latitude, longitude);
        
        setSelectedLat(latitude);
        setSelectedLng(longitude);
        setLocation({ address, lat: latitude, lng: longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        onLocationSelect({ address, lat: latitude, lng: longitude });
        Alert.alert('Success', 'Location found!');
      } else {
        Alert.alert('Not Found', 'No location found for this address');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search location');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLat === 0 || selectedLng === 0) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    onLocationSelect({
      address: location.address || `${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`,
      lat: selectedLat,
      lng: selectedLng,
    });
    setModalVisible(false);
  };

  const handleMapPress = (e: any) => {
    if (Platform.OS === 'web') return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLat(latitude);
    setSelectedLng(longitude);
    reverseGeocode(latitude, longitude).then(address => {
      setLocation({
        address,
        lat: latitude,
        lng: longitude,
      });
    });
  };

  // Render Mobile Map
  const renderMobileMap = () => {
    if (Platform.OS === 'web' || !MapView) {
      return renderWebFallback();
    }

    return (
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion: any) => setRegion(newRegion)}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker
          coordinate={{
            latitude: selectedLat,
            longitude: selectedLng,
          }}
          draggable
          onDragEnd={(e: any) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedLat(latitude);
            setSelectedLng(longitude);
            reverseGeocode(latitude, longitude).then(address => {
              setLocation({
                address,
                lat: latitude,
                lng: longitude,
              });
            });
          }}
          title="Selected Location"
          description={location.address}
        />
      </MapView>
    );
  };

  // Render Web Fallback
  const renderWebFallback = () => {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webMapPlaceholder}>
          <Ionicons name="location-outline" size={80} color="#ccc" />
          
          <Text style={styles.webMapTitle}>Select Location</Text>
          <Text style={styles.webMapSubtitle}>
            Enter coordinates manually or use "Get Current Location"
          </Text>
          
          <View style={styles.webCoordinatesContainer}>
            <View style={styles.webCoordinateInput}>
              <Text style={styles.webCoordinateLabel}>Latitude</Text>
              <TextInput
                style={styles.webCoordinateInputField}
                value={selectedLat.toString()}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  if (!isNaN(num)) {
                    setSelectedLat(num);
                    setLocation({ ...location, lat: num });
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="Enter latitude (e.g., 14.6819)"
              />
            </View>
            <View style={styles.webCoordinateInput}>
              <Text style={styles.webCoordinateLabel}>Longitude</Text>
              <TextInput
                style={styles.webCoordinateInputField}
                value={selectedLng.toString()}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  if (!isNaN(num)) {
                    setSelectedLng(num);
                    setLocation({ ...location, lng: num });
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="Enter longitude (e.g., 77.6006)"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.webGetLocationButton}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="locate" size={20} color="#fff" />
                <Text style={styles.webGetLocationText}>Get Current Location</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.webMapNote}>
            💡 Tip: On mobile, you'll see an interactive map
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.locationPicker}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.locationDisplay}>
          <Ionicons name="location-outline" size={24} color="#4F46E5" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Location</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {location.address || 'Tap to select location'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#4F46E5" />
        ) : (
          <>
            <Ionicons name="locate" size={20} color="#4F46E5" />
            <Text style={styles.currentLocationText}>Get Current Location</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={handleConfirmLocation}>
              <Text style={styles.modalConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search address..."
              value={searchAddress}
              onChangeText={setSearchAddress}
              onSubmitEditing={searchLocation}
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            {renderMobileMap()}
          </View>

          {location.address && (
            <View style={styles.selectedLocationInfo}>
              <Ionicons name="location-sharp" size={24} color="#4F46E5" />
              <Text style={styles.selectedLocationText} numberOfLines={2}>
                {location.address}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  locationPicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fafafa',
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  currentLocationText: {
    marginLeft: 8,
    color: '#4F46E5',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalConfirm: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  webMapTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  webMapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  webCoordinatesContainer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 20,
  },
  webCoordinateInput: {
    marginBottom: 12,
  },
  webCoordinateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  webCoordinateInputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  webGetLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  webGetLocationText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  webMapNote: {
    marginTop: 16,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  selectedLocationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
});