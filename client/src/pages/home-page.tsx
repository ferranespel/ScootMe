import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScooterCard } from '@/components/scooter-card';
import { Map } from '@/components/ui/map';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/main-layout';
import { BottomSheet } from '@/components/bottom-sheet';
import { QRScannerModal } from '@/components/qr-scanner-modal';
import { UnlockConfirmationModal } from '@/components/unlock-confirmation-modal';
import { RideModal } from '@/components/ride-modal';
import { PaymentSuccessModal } from '@/components/payment-success-modal';
import { QrCode, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Scooter, Ride } from '@shared/schema';

export default function HomePage() {
  const { toast } = useToast();
  
  // State for user location
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | undefined>();
  
  // State for modals
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedScooter, setSelectedScooter] = useState<Scooter | null>(null);
  const [activeRideData, setActiveRideData] = useState<{rideId: number, scooterId: string, batteryLevel: number} | null>(null);
  const [rideModalOpen, setRideModalOpen] = useState(false);
  const [paymentSuccessOpen, setPaymentSuccessOpen] = useState(false);
  const [completedRideDetails, setCompletedRideDetails] = useState({
    duration: '0 min',
    distance: '0 km',
    unlockingFee: 1.0,
    rideFee: 0,
    total: 1.0
  });
  
  // Fetch scooters
  const { data: scooters, isLoading: scootersLoading } = useQuery<Scooter[]>({
    queryKey: ['/api/scooters'],
  });
  
  // Fetch active ride
  const { data: activeRide, isLoading: rideLoading } = useQuery<Ride>({
    queryKey: ['/api/rides/active'],
    refetchInterval: activeRideData ? 5000 : false, // Poll every 5 seconds when in a ride
  });
  
  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Could not access your location. Using default location.",
            variant: "destructive",
          });
          
          // Use default location (Reykjavik, Iceland)
          setUserLocation({
            latitude: 64.1466,
            longitude: -21.9426
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      
      // Use default location (Reykjavik, Iceland)
      setUserLocation({
        latitude: 64.1466,
        longitude: -21.9426
      });
    }
  }, []);
  
  // Check for active ride on load
  useEffect(() => {
    if (activeRide && !rideLoading) {
      // Find the scooter for this ride
      const relatedScooter = scooters?.find(s => s.id === activeRide.scooterId);
      if (relatedScooter) {
        setActiveRideData({
          rideId: activeRide.id,
          scooterId: relatedScooter.scooterId,
          batteryLevel: relatedScooter.batteryLevel
        });
        setRideModalOpen(true);
      }
    } else if (!activeRide && activeRideData) {
      // If we had an active ride but now we don't, clear it
      setActiveRideData(null);
      setRideModalOpen(false);
    }
  }, [activeRide, scooters, rideLoading]);
  
  const handleScanQR = () => {
    setQrScannerOpen(true);
  };
  
  const handleQrSuccess = (scooterId: string) => {
    setQrScannerOpen(false);
    
    // Find the scooter by scooterId
    const scooter = scooters?.find(s => s.scooterId === scooterId);
    
    if (scooter) {
      setSelectedScooter(scooter);
      setUnlockModalOpen(true);
    } else {
      toast({
        title: "Scooter Not Found",
        description: `No scooter found with ID ${scooterId}`,
        variant: "destructive",
      });
    }
  };
  
  const handleScooterSelect = (scooter: Scooter) => {
    setSelectedScooter(scooter);
    setUnlockModalOpen(true);
  };
  
  const handleStartRide = (rideId: number) => {
    setUnlockModalOpen(false);
    
    if (selectedScooter) {
      setActiveRideData({
        rideId,
        scooterId: selectedScooter.scooterId,
        batteryLevel: selectedScooter.batteryLevel
      });
      setRideModalOpen(true);
    }
  };
  
  const handleEndRide = () => {
    setRideModalOpen(false);
    
    // Show payment success
    setCompletedRideDetails({
      duration: '23 min',
      distance: '2.7 km',
      unlockingFee: 1.0,
      rideFee: 3.45,
      total: 4.45
    });
    
    setPaymentSuccessOpen(true);
  };
  
  // Calculate distances to scooters
  const getScootersWithDistance = () => {
    if (!scooters || !userLocation) return [];
    
    return scooters.map(scooter => {
      // Calculate distance (simplified)
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        scooter.latitude,
        scooter.longitude
      );
      
      return { ...scooter, distance };
    }).sort((a, b) => a.distance - b.distance);
  };
  
  // Simple distance calculation using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };
  
  const nearbyScooters = getScootersWithDistance();
  
  return (
    <MainLayout>
      <div className="relative h-full">
        {/* Map View */}
        <Map 
          scooters={scooters || []}
          userLocation={userLocation}
          onScooterSelect={handleScooterSelect}
          className="h-full w-full"
        />
        
        {/* QR Code Scanner Button */}
        <Button 
          onClick={handleScanQR}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg z-10 hover:bg-gray-100"
        >
          <QrCode className="mr-2 h-4 w-4" />
          <span>Scan QR Code</span>
        </Button>
        
        {/* Bottom Sheet */}
        <BottomSheet isOpen={true}>
          <Tabs defaultValue="available">
            <TabsList className="w-full mb-4 grid grid-cols-4">
              <TabsTrigger value="available" className="text-sm">Available</TabsTrigger>
              <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
              <TabsTrigger value="wallet" className="text-sm">Wallet</TabsTrigger>
              <TabsTrigger value="profile" className="text-sm">Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="available" className="mt-0">
              <h2 className="text-lg font-semibold mb-2">Nearby Scooters</h2>
              
              {scootersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : nearbyScooters.length > 0 ? (
                <div className="space-y-3">
                  {nearbyScooters.map(scooter => (
                    <ScooterCard 
                      key={scooter.id}
                      scooter={scooter}
                      distance={scooter.distance}
                      onSelect={handleScooterSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No scooters available nearby</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <h2 className="text-lg font-semibold mb-2">Recent Rides</h2>
              <p className="text-center py-8 text-gray-500">
                Your ride history will appear here
              </p>
            </TabsContent>
            
            <TabsContent value="wallet" className="mt-0">
              <h2 className="text-lg font-semibold mb-2">Payment Methods</h2>
              <p className="text-center py-8 text-gray-500">
                Your payment methods will appear here
              </p>
            </TabsContent>
            
            <TabsContent value="profile" className="mt-0">
              <h2 className="text-lg font-semibold mb-2">Profile</h2>
              <p className="text-center py-8 text-gray-500">
                Your profile information will appear here
              </p>
            </TabsContent>
          </Tabs>
        </BottomSheet>
        
        {/* Modals */}
        <QRScannerModal 
          isOpen={qrScannerOpen} 
          onClose={() => setQrScannerOpen(false)}
          onSuccess={handleQrSuccess}
        />
        
        {selectedScooter && (
          <UnlockConfirmationModal
            isOpen={unlockModalOpen}
            onClose={() => setUnlockModalOpen(false)}
            scooterId={selectedScooter.scooterId}
            scooterDatabaseId={selectedScooter.id}
            onSuccess={handleStartRide}
          />
        )}
        
        {activeRideData && (
          <RideModal
            isOpen={rideModalOpen}
            onClose={() => setRideModalOpen(false)}
            rideId={activeRideData.rideId}
            scooterId={activeRideData.scooterId}
            batteryLevel={activeRideData.batteryLevel}
            onEndRide={handleEndRide}
          />
        )}
        
        <PaymentSuccessModal
          isOpen={paymentSuccessOpen}
          onClose={() => setPaymentSuccessOpen(false)}
          rideDetails={completedRideDetails}
        />
      </div>
    </MainLayout>
  );
}
