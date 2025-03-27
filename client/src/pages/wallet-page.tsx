import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { MainLayout } from '@/components/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Wallet, CreditCard, Plus, CheckCircle2, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function WalletPage() {
  const { user } = useAuth();
  const [addBalanceOpen, setAddBalanceOpen] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Mutation to add balance
  const addBalanceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/add-balance", { amount });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setPaymentSuccess(true);
    }
  });

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate card details (simplified)
    if (!cardNumber || !expiryDate || !cvv || !name) {
      // In real app, show field-specific errors
      return;
    }
    
    addBalanceMutation.mutate();
  };

  const handleAddBalanceClose = () => {
    setAddBalanceOpen(false);
    setPaymentSuccess(false);
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setAmount(10);
  };

  // Format credit card number with spaces
  const formatCardNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, '').substring(0, 16);
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted;
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (input: string) => {
    const cleaned = input.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length > 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    }
    return cleaned;
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">Wallet</h1>
        
        {/* Balance Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary to-secondary text-white">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Wallet className="h-6 w-6 mr-2" />
              <h2 className="text-lg font-semibold">Your Balance</h2>
            </div>
            <div className="text-3xl font-bold mb-2">${user?.balance?.toFixed(2) || '0.00'}</div>
            <Button 
              onClick={() => setAddBalanceOpen(true)}
              variant="outline" 
              className="bg-white/20 hover:bg-white/30 text-white border-white/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Funds
            </Button>
          </CardContent>
        </Card>
        
        {/* Payment Methods */}
        <Tabs defaultValue="cards">
          <TabsList className="w-full mb-4 grid grid-cols-2">
            <TabsTrigger value="cards">Payment Cards</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <svg 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-blue-800"
                        >
                          <path 
                            d="M22 12C22 17.5 17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12Z" 
                            fill="#1A56DB"
                          />
                          <path 
                            d="M10 16L14 8M7 13H17" 
                            stroke="white" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold">Visa •••• 4582</h3>
                        <p className="text-sm text-gray-500">Expires 09/24</p>
                      </div>
                    </div>
                    <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setAddBalanceOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="transactions">
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">No transactions yet</h3>
              <p className="text-gray-500 mt-1">
                Your transaction history will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Add Balance Dialog */}
        <Dialog open={addBalanceOpen} onOpenChange={handleAddBalanceClose}>
          <DialogContent className="sm:max-w-md">
            {!paymentSuccess ? (
              <>
                <DialogHeader>
                  <DialogTitle>Add Funds to Your Wallet</DialogTitle>
                  <DialogDescription>
                    Add money to your ScootMe balance to pay for rides
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddFunds} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0 border-gray-300">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input 
                        type="number" 
                        min="5"
                        step="5"
                        className="rounded-l-none"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Card Number</label>
                    <Input 
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expiry Date</label>
                      <Input 
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CVV</label>
                      <Input 
                        placeholder="123"
                        type="password"
                        maxLength={3}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name on Card</label>
                    <Input 
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleAddBalanceClose}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addBalanceMutation.isPending}
                    >
                      {addBalanceMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Add $${amount}`
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">Payment Successful</h2>
                <p className="text-center text-gray-500">
                  ${amount} has been added to your wallet balance
                </p>
                <Button onClick={handleAddBalanceClose} className="mt-4">
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
