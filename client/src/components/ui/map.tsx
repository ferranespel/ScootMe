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

export function Map({ scooters, userLocation, onScooterSelect, className = '' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simple wrapper for the original Google Map component
  useEffect(() => {
    // Set a short delay to ensure DOM is ready and Google Maps is loaded
    const timer = setTimeout(() => {
      initMap();
    }, 500);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Function to initialize the map
  const initMap = () => {
    if (!mapRef.current) {
      console.error("Map container element not found");
      setError("Map container not available");
      setLoading(false);
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      setError("Failed to load Google Maps");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Initializing map");
      
      // Default location (Reykjavik, Iceland)
      const center = userLocation 
        ? { lat: userLocation.latitude, lng: userLocation.longitude }
        : { lat: 64.1466, lng: -21.9426 };
      
      // Create the map
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        disableDefaultUI: true,
      });
      
      // Add markers for scooters
      scooters.forEach(scooter => {
        const marker = new window.google.maps.Marker({
          position: { lat: scooter.latitude, lng: scooter.longitude },
          map,
          title: `Scooter #${scooter.scooterId}`,
        });
        
        marker.addListener('click', () => {
          if (onScooterSelect) {
            onScooterSelect(scooter);
          }
        });
      });
      
      // Success!
      setLoading(false);
      
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Error initializing map");
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 h-full ${className}`}>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-gray-700">Loading map...</p>
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
    <div className={`w-full h-full ${className}`}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
