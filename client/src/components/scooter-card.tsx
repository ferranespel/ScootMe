import React from 'react';
import { Card } from "@/components/ui/card";
import { Battery, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Scooter {
  id: number;
  scooterId: string;
  batteryLevel: number;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
}

interface ScooterCardProps {
  scooter: Scooter;
  distance?: number;
  onSelect: (scooter: Scooter) => void;
}

export function ScooterCard({ scooter, distance, onSelect }: ScooterCardProps) {
  const getBatteryIcon = (level: number) => {
    if (level >= 75) {
      return "text-green-500";
    } else if (level >= 40) {
      return "text-yellow-500";
    } else {
      return "text-red-500";
    }
  };

  const getDistanceText = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m away`;
    } else {
      return `${(meters / 1000).toFixed(1)}km away`;
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary text-xl"
          >
            <path d="M19 7h2v10h-2z"/>
            <path d="M16 20H8a5 5 0 0 1-5-5V9a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">ScootMe #{scooter.scooterId}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Battery className={getBatteryIcon(scooter.batteryLevel)} size={16} />
            <span>{scooter.batteryLevel}%</span>
            {distance && (
              <>
                <span className="mx-1">•</span>
                <MapPin size={16} />
                <span>{getDistanceText(distance)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <Button 
        variant="default"
        size="sm"
        onClick={() => onSelect(scooter)}
        disabled={!scooter.isAvailable}
      >
        {scooter.isAvailable ? 'Ride' : 'In Use'}
      </Button>
    </Card>
  );
}
