import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Ride, Payment } from '@shared/schema';
import { 
  Route, 
  Clock, 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function HistoryPage() {
  // Fetch rides
  const { data: rides, isLoading: ridesLoading } = useQuery<Ride[]>({
    queryKey: ['/api/rides'],
  });

  // Fetch payments
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start: string | Date, end: string | Date | null) => {
    if (!end) return 'In progress';
    
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    
    const minutes = Math.floor(durationMs / (1000 * 60));
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const isLoading = ridesLoading || paymentsLoading;

  // Get completed rides with payment information
  const getCompletedRides = () => {
    if (!rides || !payments) return [];
    
    return rides
      .filter(ride => ride.status === 'completed')
      .map(ride => {
        // Find related payment
        const payment = payments.find(p => p.rideId === ride.id);
        
        return {
          ...ride,
          payment,
        };
      })
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime());
  };

  const completedRides = getCompletedRides();

  return (
    <MainLayout>
      <div className="container mx-auto p-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">Ride History</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : completedRides.length > 0 ? (
          <div className="space-y-4">
            {completedRides.map(ride => (
              <Card key={ride.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">Ride #{ride.id}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(ride.startTime)}</span>
                          <span className="mx-1">•</span>
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatTime(ride.startTime)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">${ride.payment?.amount.toFixed(2) || 'N/A'}</span>
                        <div className="flex items-center text-xs text-green-500 justify-end">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span>Completed</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-y-2 text-sm">
                      <div className="flex items-center w-1/2">
                        <Clock className="h-4 w-4 text-primary mr-1" />
                        <span>{calculateDuration(ride.startTime, ride.endTime)}</span>
                      </div>
                      <div className="flex items-center w-1/2">
                        <Route className="h-4 w-4 text-primary mr-1" />
                        <span>{ride.distance ? `${ride.distance.toFixed(1)} km` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center w-full mt-1">
                        <MapPin className="h-4 w-4 text-primary mr-1" />
                        <span className="truncate">
                          {`${ride.startLatitude.toFixed(4)}, ${ride.startLongitude.toFixed(4)}`}
                          {ride.endLatitude ? ` → ${ride.endLatitude.toFixed(4)}, ${ride.endLongitude.toFixed(4)}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {ride.payment && (
                    <div className="bg-gray-50 p-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base fee</span>
                        <span>$1.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Time charge</span>
                        <span>${(ride.payment.amount - 1).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold mt-1 pt-1 border-t border-gray-200">
                        <span>Total</span>
                        <span>${ride.payment.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Route className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No rides yet</h3>
            <p className="text-gray-500 mt-1 max-w-sm">
              Your completed rides will appear here. Start your first ride to see your history.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
