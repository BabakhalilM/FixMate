import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface WebMapProps {
  selectedLat: number;
  selectedLng: number;
  onLocationSelect: (lat: number, lng: number) => void;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
}

export default function WebMap({ 
  selectedLat, 
  selectedLng, 
  onLocationSelect,
  location 
}: WebMapProps) {
  const mapRef = useRef<any>(null);

  // Use Leaflet for web
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        initializeMap();
      };
      document.body.appendChild(script);

      return () => {
        document.head.removeChild(link);
        document.body.removeChild(script);
      };
    }
  }, []);

  const initializeMap = () => {
    if (typeof window === 'undefined' || !(window as any).L) return;

    const L = (window as any).L;
    
    // Create map if it doesn't exist
    if (!mapRef.current) {
      const mapContainer = document.getElementById('web-map');
      if (!mapContainer) return;

      const map = L.map('web-map').setView(
        [selectedLat || 14.6819, selectedLng || 77.6006], 
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add marker
      const marker = L.marker([selectedLat || 14.6819, selectedLng || 77.6006], {
        draggable: true
      }).addTo(map);

      marker.bindPopup('Selected Location');

      marker.on('dragend', function(this: any) {
        const pos = this.getLatLng();
        onLocationSelect(pos.lat, pos.lng);
      });

      map.on('click', function(e: any) {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onLocationSelect(lat, lng);
      });

      mapRef.current = { map, marker };
    }
  };

  return (
    <View style={styles.container}>
      <div id="web-map" style={{ width: '100%', height: '100%' }} />
      <View style={styles.addressInfo}>
        <Text style={styles.addressText}>{location.address || 'Tap on map to select location'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  addressInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});