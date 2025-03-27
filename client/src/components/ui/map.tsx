import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, Map as MapIcon } from 'lucide-react';

// Define types
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Check if Google Maps API is loaded
  const isGoogleMapsLoaded = () => {
    return window.google && window.google.maps;
  };
  
  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    if (isGoogleMapsLoaded()) {
      console.log("Google Maps already loaded");
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      try {
        // Get API key from environment
        const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY;
        
        // Create callback function that will be called when the script loads
        window.initMap = () => {
          console.log("Google Maps script loaded successfully");
          resolve();
        };
        
        // Create script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          console.error("Failed to load Google Maps script");
          reject(new Error("Failed to load Google Maps"));
        };
        
        // Add to document
        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        reject(error);
      }
    });
  }, []);
  
  // Add a marker to the map
  const addMarker = useCallback((map: any, scooter: Scooter) => {
    const marker = new window.google.maps.Marker({
      position: { lat: scooter.latitude, lng: scooter.longitude },
      map,
      title: `Scooter #${scooter.scooterId} - Battery: ${scooter.batteryLevel}%`,
    });
    
    marker.addListener('click', () => {
      if (onScooterSelect) {
        onScooterSelect(scooter);
      }
    });
    
    // Store marker reference
    markersRef.current.push(marker);
  }, [onScooterSelect]);
  
  // Initialize map with specific element
  const createMapInstance = useCallback((element: HTMLElement) => {
    if (!isGoogleMapsLoaded()) {
      console.error("Google Maps not loaded yet");
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Creating new Google Map instance");
      
      // Default location (United States - centered on continental US)
      const defaultCenter = { lat: 39.8283, lng: -98.5795 };
      
      // Use user location if available
      const center = userLocation ? 
        { lat: userLocation.latitude, lng: userLocation.longitude } : 
        defaultCenter;
      
      // Create new map
      const mapOptions = {
        center,
        zoom: 4, // Lower zoom level to show more of the US
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
      };
      
      // Create the map
      const map = new window.google.maps.Map(element, mapOptions);
      googleMapRef.current = map;
      
      // Add scooter markers
      if (scooters && scooters.length > 0) {
        scooters.forEach(scooter => {
          if (scooter.latitude && scooter.longitude) {
            addMarker(map, scooter);
          }
        });
      }
      
      // Add user location marker if available
      if (userLocation) {
        new window.google.maps.Marker({
          position: { lat: userLocation.latitude, lng: userLocation.longitude },
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          zIndex: 999,
        });
      }
      
      setMapLoaded(true);
      setIsLoading(false);
      console.log("Map initialized successfully");
      
    } catch (error) {
      console.error("Error initializing map:", error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [addMarker, scooters, userLocation]);
  
  // Initialize map
  const initializeMap = useCallback(() => {
    // First try to use the ref
    if (mapContainerRef.current) {
      createMapInstance(mapContainerRef.current);
    } else {
      // As a fallback, try to find the element by ID
      console.log("Map container ref not available, trying getElementById");
      const mapContainer = document.getElementById('google-map-container');
      
      if (mapContainer) {
        createMapInstance(mapContainer);
      } else {
        console.error("Map container not found by ref or ID");
        setHasError(true);
        setIsLoading(false);
      }
    }
  }, [createMapInstance]);
  
  // Main effect: Load Google Maps and initialize the map
  useEffect(() => {
    console.log("Map component mounted");
    
    let isMounted = true;
    
    const setupMap = async () => {
      try {
        await loadGoogleMapsScript();
        
        if (isMounted) {
          console.log("Proceeding to initialize map");
          // Short delay to ensure DOM is ready
          setTimeout(() => {
            if (isMounted) {
              initializeMap();
            }
          }, 100);
        }
      } catch (error) {
        console.error("Map setup failed:", error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };
    
    setupMap();
    
    return () => {
      isMounted = false;
      
      // Cleanup markers
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, [loadGoogleMapsScript, initializeMap]);
  
  // Update markers when scooters or user location changes
  useEffect(() => {
    if (mapLoaded && googleMapRef.current) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      // Add new markers
      scooters.forEach(scooter => {
        addMarker(googleMapRef.current, scooter);
      });
      
      // Update center if user location changed
      if (userLocation && googleMapRef.current) {
        googleMapRef.current.setCenter({
          lat: userLocation.latitude,
          lng: userLocation.longitude
        });
      }
    }
  }, [scooters, userLocation, mapLoaded, addMarker]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 h-full ${className}`}>
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
        <p className="text-gray-700 text-center">Loading map...</p>
      </div>
    );
  }
  
  // Error state
  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 h-full p-4 ${className}`}>
        <MapIcon className="h-16 w-16 text-red-500 mb-4" />
        <p className="text-red-500 text-lg font-medium text-center">
          Unable to load the map
        </p>
        <p className="text-gray-600 mt-2 text-center">
          Please check your internet connection and try again.
        </p>
      </div>
    );
  }
  
  // Render map container
  return (
    <div className={`w-full h-full ${className}`} id="map-wrapper">
      <div 
        ref={mapContainerRef} 
        id="google-map-container"
        style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9' }}
      />
    </div>
  );
}