import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Plus, Minus, Locate } from 'lucide-react';

// Mock map type definitions
interface GoogleMap {
  setCenter: (position: { lat: number, lng: number }) => void;
  setZoom: (zoom: number) => void;
}

interface GoogleMapsMarker {
  setPosition: (position: { lat: number, lng: number }) => void;
  setMap: (map: GoogleMap | null) => void;
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
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [markers, setMarkers] = useState<{ [key: number]: GoogleMapsMarker }>({});
  const [userMarker, setUserMarker] = useState<GoogleMapsMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoomLevel] = useState(15);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        if (!mapRef.current) return;

        // Check if Google Maps API is loaded
        if (!window.google || !window.google.maps) {
          setError("Google Maps could not be loaded");
          setLoading(false);
          return;
        }

        const defaultLocation = userLocation || { latitude: 37.7749, longitude: -122.4194 }; // San Francisco by default

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: defaultLocation.latitude, lng: defaultLocation.longitude },
          zoom: zoom,
          disableDefaultUI: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        setMap(mapInstance);
        setLoading(false);
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Failed to initialize the map");
        setLoading(false);
      }
    };

    initMap();

    // Clean up
    return () => {
      // Clear markers
      if (markers) {
        Object.values(markers).forEach(marker => {
          marker.setMap(null);
        });
      }
      if (userMarker) {
        userMarker.setMap(null);
      }
    };
  }, []);

  // Update markers when scooters change
  useEffect(() => {
    if (!map || !window.google) return;
    
    // Clear old markers
    Object.values(markers).forEach(marker => {
      marker.setMap(null);
    });
    
    const newMarkers: { [key: number]: GoogleMapsMarker } = {};
    
    // Create new markers
    scooters.forEach(scooter => {
      const marker = new window.google.maps.Marker({
        position: { lat: scooter.latitude, lng: scooter.longitude },
        map: map,
        icon: {
          url: `data:image/svg+xml;utf8,
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="white" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
            <path d="M12 12L20 20M12 20L20 12" stroke="${scooter.isAvailable ? '#3B82F6' : '#9CA3AF'}" stroke-width="2"/>
          </svg>`,
          scaledSize: new window.google.maps.Size(32, 32),
        },
        title: `ScootMe #${scooter.scooterId} - Battery: ${scooter.batteryLevel}%`
      });
      
      marker.addListener('click', () => {
        if (onScooterSelect) {
          onScooterSelect(scooter);
        }
      });
      
      newMarkers[scooter.id] = marker;
    });
    
    setMarkers(newMarkers);
  }, [map, scooters, onScooterSelect]);

  // Update user location marker
  useEffect(() => {
    if (!map || !window.google || !userLocation) return;
    
    if (userMarker) {
      userMarker.setPosition({ lat: userLocation.latitude, lng: userLocation.longitude });
    } else {
      // Create user marker
      const marker = new window.google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: map,
        icon: {
          url: `data:image/svg+xml;utf8,
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#3B82F6" fill-opacity="0.2"/>
            <circle cx="12" cy="12" r="6" fill="#3B82F6"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>`,
          scaledSize: new window.google.maps.Size(24, 24),
        },
        zIndex: 1000
      });
      
      setUserMarker(marker);
    }
    
    // Center map on user
    map.setCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
  }, [map, userLocation]);

  const handleZoomIn = () => {
    if (map) {
      const newZoom = Math.min(20, zoom + 1);
      map.setZoom(newZoom);
      setZoomLevel(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const newZoom = Math.max(10, zoom - 1);
      map.setZoom(newZoom);
      setZoomLevel(newZoom);
    }
  };

  const handleCenterOnUser = () => {
    if (map && userLocation) {
      map.setCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 p-4 ${className}`}>
        <p className="text-red-500">{error}</p>
        <p className="text-sm text-gray-500 mt-2">
          Please check your internet connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Controls */}
      <div className="absolute right-4 bottom-32 flex flex-col space-y-2">
        <button
          onClick={handleZoomIn}
          className="bg-white p-3 rounded-full shadow-lg transition-colors hover:bg-gray-100"
          aria-label="Zoom in"
        >
          <Plus className="h-5 w-5 text-gray-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white p-3 rounded-full shadow-lg transition-colors hover:bg-gray-100"
          aria-label="Zoom out"
        >
          <Minus className="h-5 w-5 text-gray-700" />
        </button>
        <button
          onClick={handleCenterOnUser}
          className="bg-white p-3 rounded-full shadow-lg transition-colors hover:bg-gray-100"
          aria-label="Center on my location"
        >
          <Locate className="h-5 w-5 text-primary" />
        </button>
      </div>
    </div>
  );
}
