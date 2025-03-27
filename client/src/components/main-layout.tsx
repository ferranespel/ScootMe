import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Bell, Map, History, Wallet, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface MainLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export function MainLayout({ children, showBottomNav = true }: MainLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.fullName) return 'U';
    
    const nameParts = user.fullName.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const showNotifications = () => {
    toast({
      title: "Notifications",
      description: "This feature is coming soon.",
    });
  };

  const navItems = [
    { path: '/', label: 'Map', icon: Map },
    { path: '/history', label: 'History', icon: History },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="relative h-screen flex flex-col">
      {/* Header */}
      <header className="relative z-10 bg-white shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-primary"
            >
              <path 
                d="M3.05493 11H10L12 14H19.9451M6.5 18C6.5 19.1046 5.60457 20 4.5 20C3.39543 20 2.5 19.1046 2.5 18C2.5 16.8954 3.39543 16 4.5 16C5.60457 16 6.5 16.8954 6.5 18ZM20.5 18C20.5 19.1046 19.6046 20 18.5 20C17.3954 20 16.5 19.1046 16.5 18C16.5 16.8954 17.3954 16 18.5 16C19.6046 16 20.5 16.8954 20.5 18ZM14.5 6L16.5 9H21.5L19.5 6H14.5Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="text-xl font-bold">ScootMe</h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-light rounded-full"
                onClick={showNotifications}
              >
                <Bell className="h-5 w-5 text-dark" />
              </Button>
              <Avatar className="bg-primary text-white h-10 w-10">
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </div>
          )}

          {!user && (
            <Link href="/auth">
              <Button className="bg-primary text-white px-4 py-2 rounded-lg">
                Login
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      {showBottomNav && (
        <nav className="bg-white h-16 fixed bottom-0 left-0 right-0 border-t border-gray-200 z-10">
          <div className="grid grid-cols-4 h-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link href={item.path} key={item.path}>
                  <a className={`flex flex-col items-center justify-center ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                    <Icon className="text-lg" size={20} />
                    <span className="text-xs mt-1">{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
