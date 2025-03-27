import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (scooterId: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onSuccess }: QRScannerModalProps) {
  const [manualMode, setManualMode] = useState(false);
  const [scooterId, setScooterId] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scooterId.trim()) {
      setError('Please enter a scooter ID');
      return;
    }
    
    onSuccess(scooterId);
    setScooterId('');
    setManualMode(false);
  };
  
  const toggleFlash = () => {
    // In a real app, this would toggle the camera flash
    console.log('Toggle flash');
  };
  
  const handleClose = () => {
    setScooterId('');
    setManualMode(false);
    setError(null);
    onClose();
  };
  
  // Simulate QR code scanning detection
  React.useEffect(() => {
    if (isOpen && !manualMode) {
      const timer = setTimeout(() => {
        // In a real app, this would be triggered by the actual QR code scanner
        // when it detects a valid QR code
        // onSuccess('A245');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, manualMode, onSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="p-0 max-w-full h-[100vh] m-0 rounded-none" showClose={false}>
        <div className="fixed inset-0 bg-black">
          <div className="relative h-full">
            {/* Camera View */}
            <div className="w-full h-full bg-black flex items-center justify-center">
              <div className="w-full h-full bg-black/60 flex items-center justify-center">
                {/* This would be a real camera view */}
                <svg 
                  viewBox="0 0 100 100" 
                  className="w-full h-full absolute inset-0"
                >
                  <defs>
                    <mask id="scan-area">
                      <rect width="100%" height="100%" fill="white" />
                      <rect x="25" y="30" width="50" height="40" fill="black" rx="2" />
                    </mask>
                  </defs>
                  <rect 
                    width="100%" 
                    height="100%" 
                    fill="rgba(0, 0, 0, 0.5)" 
                    mask="url(#scan-area)" 
                  />
                </svg>
                
                {/* Scan Frame */}
                <div className="relative w-64 h-64 border-2 border-white rounded-lg z-10">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary" />
                </div>
                
                {/* Scanning line animation */}
                <motion.div 
                  className="absolute w-60 h-0.5 bg-primary opacity-70 z-10"
                  initial={{ y: -60 }}
                  animate={{ y: 60 }}
                  transition={{ 
                    repeat: Infinity, 
                    repeatType: "reverse", 
                    duration: 1.5, 
                    ease: "linear" 
                  }}
                />
              </div>
            </div>
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4">
              <div className="flex justify-between items-center">
                <button 
                  className="text-white bg-black/30 rounded-full p-2"
                  onClick={handleClose}
                >
                  <X size={24} />
                </button>
                <button 
                  className="text-white bg-black/30 rounded-full p-2"
                  onClick={toggleFlash}
                >
                  <Lightbulb size={24} />
                </button>
              </div>
            </div>
            
            {/* Instructions or Manual Input */}
            <AnimatePresence mode="wait">
              {!manualMode ? (
                <motion.div 
                  key="instructions"
                  className="absolute bottom-0 left-0 right-0 p-6 text-center bg-black/50 backdrop-blur-sm"
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  exit={{ y: 100 }}
                >
                  <h2 className="text-white text-xl font-bold mb-2">Scan QR Code</h2>
                  <p className="text-white text-sm mb-6">Position the QR code within the frame to unlock the scooter</p>
                  <Button 
                    variant="outline" 
                    className="w-full bg-white text-black hover:bg-gray-100"
                    onClick={() => setManualMode(true)}
                  >
                    Enter code manually
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  key="manual"
                  className="absolute bottom-0 left-0 right-0 p-6 text-center bg-black/50 backdrop-blur-sm"
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  exit={{ y: 100 }}
                >
                  <h2 className="text-white text-xl font-bold mb-2">Enter Scooter Code</h2>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <Input
                      value={scooterId}
                      onChange={(e) => {
                        setScooterId(e.target.value);
                        setError(null);
                      }}
                      placeholder="Example: A245"
                      className="bg-white text-black"
                      maxLength={10}
                    />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="bg-white text-black hover:bg-gray-100"
                        onClick={() => setManualMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        Unlock
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
