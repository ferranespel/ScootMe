import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';

interface RideDetails {
  duration: string;
  distance: string;
  unlockingFee: number;
  rideFee: number;
  total: number;
}

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideDetails: RideDetails;
}

export function PaymentSuccessModal({ isOpen, onClose, rideDetails }: PaymentSuccessModalProps) {
  const [, setLocation] = useLocation();
  
  const handleViewReceipt = () => {
    setLocation('/history');
    onClose();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="text-secondary text-2xl" />
          </div>
          <h2 className="text-xl font-bold">Ride Completed!</h2>
          <p className="text-gray-600 text-sm mb-4">
            Thanks for riding with ScootMe. Your payment has been processed successfully.
          </p>
          
          <div className="bg-light rounded-lg p-4 space-y-3 w-full mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Duration</span>
              <span className="font-semibold">{rideDetails.duration}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Distance</span>
              <span className="font-semibold">{rideDetails.distance}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Unlocking Fee</span>
              <span className="font-semibold">{formatCurrency(rideDetails.unlockingFee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ride Fee</span>
              <span className="font-semibold">{formatCurrency(rideDetails.rideFee)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-xl">{formatCurrency(rideDetails.total)}</span>
            </div>
          </div>
          
          <div className="space-y-2 w-full">
            <Button 
              className="w-full"
              onClick={handleViewReceipt}
            >
              View Receipt
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
