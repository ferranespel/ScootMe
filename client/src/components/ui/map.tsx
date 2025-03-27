import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Define types
declare global {
  interface Window {
    google: any;
  }
}

interface Scooter {
  id: number;
  scooterId: string;
  batteryLevel: number;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
}

interface MapProps {
  scooters: Scooter[];
  userLocation?: { latitude: number; longitude: number };
  onScooterSelect?: (scooter: Scooter) => void;
  className?: string;
}

// Simple function to check if Google Maps is loaded
const isGoogleMapsLoaded = () => {
  return window.google && window.google.maps;
};

export function Map({ scooters, userLocation, onScooterSelect, className = '' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize and render the map
  useEffect(() => {
    console.log("Map component mounted");
    
    // Check if element exists
    if (!mapRef.current) {
      console.error("Map container element not found");
      return;
    }
    
    // Set a timeout to wait for Google Maps to load
    const timeoutId = setTimeout(() => {
      if (!isGoogleMapsLoaded()) {
        console.error("Google Maps failed to load within timeout");
        setError("Failed to load Google Maps API");
        setLoading(false);
      }
    }, 10000);
    
    // Try to initialize the map
    const initializeMap = () => {
      if (!isGoogleMapsLoaded()) {
        console.log("Google Maps not yet loaded, waiting...");
        setTimeout(initializeMap, 500);
        return;
      }
      
      console.log("Google Maps loaded, initializing map...");
      clearTimeout(timeoutId);
      
      try {
        // Create a map centered on Reykjavik, Iceland
        const center = { lat: 64.1466, lng: -21.9426 };
        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          disableDefaultUI: true
        });
        
        console.log("Map created successfully");
        
        // Add markers for each scooter
        scooters.forEach(scooter => {
          const marker = new window.google.maps.Marker({
            position: { lat: scooter.latitude, lng: scooter.longitude },
            map,
            title: `Scooter #${scooter.scooterId}`,
          });
          
          // Add click listener
          marker.addListener('click', () => {
            if (onScooterSelect) {
              onScooterSelect(scooter);
            }
          });
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Error initializing map");
        setLoading(false);
      }
    };
    
    // Start the initialization process
    initializeMap();
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, [scooters, onScooterSelect]);
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 h-full ${className}`}>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Loading map...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 h-full p-4 ${className}`}>
        <p className="text-red-500 text-lg font-medium">{error}</p>
        <p className="text-gray-600 mt-2">
          Please check your internet connection and try again.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`w-full h-full ${className}`} style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
