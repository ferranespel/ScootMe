import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Headset } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface RideModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: number;
  scooterId: string;
  batteryLevel: number;
  onEndRide: () => void;
}

export function RideModal({ isOpen, onClose, rideId, scooterId, batteryLevel, onEndRide }: RideModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentFare, setCurrentFare] = useState(1.0); // Starting with base fare
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Update timer and fare every second
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      // $1.00 base + $0.15 per minute
      const minutes = elapsedTime / 60;
      setCurrentFare(1.0 + (minutes * 0.15));
      // Update progress (for visualization)
      setProgress(Math.min(100, (elapsedTime / (60 * 30)) * 100)); // 30 minutes max for visualization
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, elapsedTime]);

  // Mutation to end ride
  const endRideMutation = useMutation({
    mutationFn: async () => {
      // In a real app, we would get the actual current position
      const currentPosition = {
        endLatitude: 37.7749,
        endLongitude: -122.4194
      };
      const res = await apiRequest("POST", `/api/rides/${rideId}/end`, currentPosition);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rides/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scooters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      onEndRide();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to end ride",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEndRide = () => {
    endRideMutation.mutate();
  };

  const handleReportIssue = () => {
    toast({
      title: "Report Issue",
      description: "This feature is coming soon.",
    });
  };

  const handleGetHelp = () => {
    toast({
      title: "Customer Support",
      description: "This feature is coming soon.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Current Ride</h2>
            <div className="bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-primary font-semibold text-sm">{formatTime(elapsedTime)}</span>
            </div>
          </div>
          
          <div className="bg-light rounded-xl p-4">
            <div className="flex justify-between mb-3">
              <div>
                <h3 className="font-semibold">ScootMe #{scooterId}</h3>
                <p className="text-sm text-gray-500">Battery: {batteryLevel}%</p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-lg">${currentFare.toFixed(2)}</span>
                <p className="text-xs text-gray-500">Current fare</p>
              </div>
            </div>
            
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Start</span>
              <span>Current</span>
              <span>{(progress / 100 * 3).toFixed(1)} km</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="py-6"
              onClick={handleReportIssue}
              disabled={endRideMutation.isPending}
            >
              <div className="flex flex-col items-center">
                <Camera className="mb-1" />
                <span>Report Issue</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="py-6"
              onClick={handleGetHelp}
              disabled={endRideMutation.isPending}
            >
              <div className="flex flex-col items-center">
                <Headset className="mb-1" />
                <span>Get Help</span>
              </div>
            </Button>
          </div>
          
          <Button 
            variant="destructive"
            className="w-full py-4 font-bold"
            onClick={handleEndRide}
            disabled={endRideMutation.isPending}
          >
            {endRideMutation.isPending ? "Ending Ride..." : "End Ride"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
