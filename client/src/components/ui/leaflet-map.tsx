import React, { useState, useCallback } from 'react';
import { Loader2, MapIcon, Battery } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icon issue in React
// This is needed because Leaflet's default marker icons rely on assets that
// get processed differently in bundled applications
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Scooter type definition
interface Scooter {
  id: number;
  scooterId: string;
  batteryLevel: number;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
}

// Map component props
interface MapProps {
  scooters: Scooter[];
  userLocation?: { latitude: number; longitude: number };
  onScooterSelect?: (scooter: Scooter) => void;
  className?: string;
}

// Custom component to update map view when props change
function MapUpdater({ userLocation }: { userLocation?: { latitude: number; longitude: number } }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 14);
    } else {
      // Center on Reykjavik, Iceland if no user location
      map.setView([64.1466, -21.9426], 12);
    }
  }, [map, userLocation]);
  
  return null;
}

// Map component
export function LeafletMap({ scooters, userLocation, onScooterSelect, className = '' }: MapProps) {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Custom marker icon factory based on battery level
  const createScooterIcon = useCallback((batteryLevel: number) => {
    let color = '#EF4444'; // red for low battery
    
    if (batteryLevel > 70) {
      color = '#22C55E'; // green for high battery
    } else if (batteryLevel > 30) {
      color = '#EAB308'; // yellow for medium battery
    }
    
    return L.divIcon({
      className: 'custom-scooter-marker',
      html: `
        <div style="background-color: white; border-radius: 50%; width: 38px; height: 38px; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 5px rgba(0,0,0,0.3);">
          <div style="color: ${color}; font-size: 20px; display: flex; justify-content: center; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="7" width="12" height="10" rx="2" ry="2"/>
              <line x1="12" y1="7" x2="12" y2="4"/>
              <line x1="10" y1="20" x2="14" y2="20"/>
              <line x1="8" y1="7" x2="16" y2="7"/>
              <line x1="12" y1="4" x2="12" y2="2"/>
              ${batteryLevel > 75 ? '<rect x="7" y="9" width="10" height="6"/>' : 
                batteryLevel > 50 ? '<rect x="7" y="9" width="7" height="6"/>' : 
                batteryLevel > 25 ? '<rect x="7" y="9" width="5" height="6"/>' : 
                '<rect x="7" y="9" width="2" height="6"/>'}
            </svg>
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -19],
    });
  }, []);
  
  // Create user location marker
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="background-color: #4F46E5; border-radius: 50%; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 10px rgba(79,70,229,0.5);">
        <div style="background-color: white; border-radius: 50%; width: 12px; height: 12px;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
  
  // Effect to set loading state
  React.useEffect(() => {
    setIsLoading(false);
  }, []);
  
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
  
  // Initial map center (Reykjavik, Iceland)
  const initialCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude] 
    : [64.1466, -21.9426]; // Center of Reykjavik
  
  const initialZoom = userLocation ? 14 : 12;
  
  // Render map
  return (
    <div className={`w-full h-full ${className}`} id="map-wrapper">
      <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Scooter markers */}
        {scooters.map(scooter => (
          <Marker 
            key={scooter.id}
            position={[scooter.latitude, scooter.longitude]}
            icon={createScooterIcon(scooter.batteryLevel)}
            eventHandlers={{
              click: () => {
                if (onScooterSelect) {
                  onScooterSelect(scooter);
                }
              }
            }}
          >
            <Popup>
              <div className="text-center">
                <div className="font-bold">Scooter {scooter.scooterId}</div>
                <div>Battery: {scooter.batteryLevel}%</div>
                <button 
                  onClick={() => onScooterSelect && onScooterSelect(scooter)}
                  className="mt-2 px-3 py-1 bg-primary text-white rounded-md text-sm"
                >
                  Select
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-center">You are here</div>
            </Popup>
          </Marker>
        )}
        
        {/* Component to update map view when props change */}
        <MapUpdater userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}