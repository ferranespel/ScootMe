import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface UnlockConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  scooterId: string;
  scooterDatabaseId: number;
  onSuccess: (rideId: number) => void;
}

export function UnlockConfirmationModal({
  isOpen,
  onClose,
  scooterId,
  scooterDatabaseId,
  onSuccess
}: UnlockConfirmationModalProps) {
  const { user } = useAuth();
  
  // Basic fee and per minute rate
  const baseFee = 1.00;
  const perMinuteRate = 0.15;
  
  // Mutation to start ride
  const startRideMutation = useMutation({
    mutationFn: async () => {
      // In a real app, we would get the actual GPS coordinates
      const currentPosition = {
        scooterId: scooterDatabaseId,
        startLatitude: 37.7749,
        startLongitude: -122.4194
      };
      
      const res = await apiRequest("POST", "/api/rides/start", currentPosition);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rides/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scooters'] });
      onSuccess(data.id);
    }
  });
  
  const handleStartRide = () => {
    startRideMutation.mutate();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-2">
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
              className="text-secondary text-2xl"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold">Unlock Scooter?</h2>
          <p className="text-gray-600 text-sm">
            You're about to unlock ScootMe #{scooterId}. The basic fee is {formatCurrency(baseFee)} and then {formatCurrency(perMinuteRate)} per minute.
          </p>
          
          <div className="bg-light rounded-lg p-3 w-full">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold">Current Balance</span>
              <span className="font-bold">{formatCurrency(user?.balance || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Unlocking Fee</span>
              <span className="font-bold text-primary">{formatCurrency(baseFee)}</span>
            </div>
          </div>
          
          <div className="space-y-2 w-full">
            <Button
              className="w-full"
              onClick={handleStartRide}
              disabled={startRideMutation.isPending}
            >
              {startRideMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Yes, Start Ride"
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
              disabled={startRideMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
