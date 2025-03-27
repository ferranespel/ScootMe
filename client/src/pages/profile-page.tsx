import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { MainLayout } from '@/components/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Settings, 
  CreditCard, 
  LogOut, 
  HelpCircle,
  ChevronRight,
  Shield,
  Bell,
  Loader2 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.fullName) return 'U';
    
    const nameParts = user.fullName.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setConfirmDialogOpen(false);
  };

  const handleSendSupportMessage = () => {
    if (!supportMessage.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter your support inquiry",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Support request sent",
      description: "We'll get back to you as soon as possible",
    });
    setSupportMessage('');
    setSupportDialogOpen(false);
  };

  const profileMenuItems = [
    {
      icon: User,
      label: "Account Details",
      onClick: () => navigate("/profile"),
    },
    {
      icon: CreditCard,
      label: "Payment Methods",
      onClick: () => navigate("/wallet"),
    },
    {
      icon: Bell,
      label: "Notifications",
      onClick: () => toast({
        title: "Coming Soon",
        description: "Notification settings will be available soon",
      }),
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      onClick: () => toast({
        title: "Coming Soon",
        description: "Privacy settings will be available soon",
      }),
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      onClick: () => setSupportDialogOpen(true),
    },
    {
      icon: LogOut,
      label: "Sign Out",
      onClick: () => setConfirmDialogOpen(true),
      variant: "destructive",
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        
        {/* User Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-20 w-20 bg-primary text-white text-2xl font-semibold mb-4">
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{user?.fullName}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <div className="mt-2 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                Balance: ${user?.balance?.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Menu */}
        <Card>
          <CardContent className="p-0 divide-y divide-gray-100">
            {profileMenuItems.map((item, index) => (
              <button
                key={index}
                className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  item.variant === "destructive" ? "text-red-500" : ""
                }`}
                onClick={item.onClick}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${item.variant === "destructive" ? "bg-red-100" : "bg-primary/10"}`}>
                    <item.icon className={`h-5 w-5 ${item.variant === "destructive" ? "text-red-500" : "text-primary"}`} />
                  </div>
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Logout Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign Out</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to sign out of your account?</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  "Sign Out"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Support Dialog */}
        <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Contact Support</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-gray-500">
                Describe your issue or question and our support team will help you.
              </p>
              <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="How can we help you?"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
              ></textarea>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSupportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendSupportMessage}>
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
