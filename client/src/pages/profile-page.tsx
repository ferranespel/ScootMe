import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { MainLayout } from '@/components/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Loader2,
  Edit,
  KeyRound,
  Camera,
  Phone
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Form validation schemas
const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;
type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  
  // Get profile data
  const { data: profileData, isLoading: isProfileLoading } = useQuery<{
    id: number;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePicture?: string;
    balance: number;
  }>({
    queryKey: ['/api/profile'],
    enabled: !!user, // Only fetch if user is logged in
  });
  
  // Form setup
  const profileForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Update profile when data loads
  React.useEffect(() => {
    if (profileData) {
      profileForm.reset({
        fullName: profileData.fullName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber || '',
      });
      
      if (profileData.profilePicture) {
        setProfilePictureUrl(profileData.profilePicture);
      }
    }
  }, [profileData]);
  
  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const res = await apiRequest('PATCH', '/api/profile', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setEditProfileOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const res = await apiRequest('POST', '/api/profile/change-password', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Changed',
        description: 'Your password has been changed successfully',
      });
      passwordForm.reset();
      setChangePasswordOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Change Password',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const updateProfilePictureMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest('POST', '/api/profile/picture', { profilePictureUrl: url });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Picture Updated',
        description: 'Your profile picture has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setProfilePictureDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Form handlers
  const onUpdateProfileSubmit = (data: UpdateProfileData) => {
    updateProfileMutation.mutate(data);
  };
  
  const onChangePasswordSubmit = (data: ChangePasswordData) => {
    changePasswordMutation.mutate(data);
  };
  
  const onProfilePictureSubmit = () => {
    if (!profilePictureUrl.trim()) {
      toast({
        title: 'Missing URL',
        description: 'Please enter a valid image URL',
        variant: 'destructive',
      });
      return;
    }
    
    updateProfilePictureMutation.mutate(profilePictureUrl);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.fullName) return 'U';
    
    const nameParts = user.fullName.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  // Format phone number for display
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '';
    
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length > 10) {
      // Handle international numbers
      return `+${digitsOnly.slice(0, digitsOnly.length-10)} (${digitsOnly.slice(-10, -7)}) ${digitsOnly.slice(-7, -4)}-${digitsOnly.slice(-4)}`;
    }
    
    // Return original if cannot format
    return phone;
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
              <div className="relative">
                <Avatar className="h-20 w-20 bg-primary text-white text-2xl font-semibold mb-4">
                  {user?.profilePicture ? (
                    <AvatarImage src={user.profilePicture} alt={user.fullName} />
                  ) : (
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  )}
                </Avatar>
                <button 
                  className="absolute -right-1 -bottom-1 bg-primary text-white rounded-full p-1 shadow-lg"
                  onClick={() => setProfilePictureDialogOpen(true)}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-xl font-semibold">{user?.fullName}</h2>
              <div className="flex flex-col items-center mt-1">
                <p className="text-gray-500">{user?.email}</p>
                {user?.phoneNumber && (
                  <p className="text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" /> {formatPhoneNumber(user.phoneNumber)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button 
                  className="text-sm text-primary flex items-center gap-1"
                  onClick={() => setEditProfileOpen(true)}
                >
                  <Edit className="h-4 w-4" /> Edit Profile
                </button>
                <Separator orientation="vertical" className="h-4" />
                <button 
                  className="text-sm text-primary flex items-center gap-1"
                  onClick={() => setChangePasswordOpen(true)}
                >
                  <KeyRound className="h-4 w-4" /> Change Password
                </button>
              </div>
              <div className="mt-4 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
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
        
        {/* Edit Profile Dialog */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={profileForm.handleSubmit(onUpdateProfileSubmit)} className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName"
                    placeholder="Your full name"
                    {...profileForm.register('fullName')}
                  />
                  {profileForm.formState.errors.fullName && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="Your email address"
                    {...profileForm.register('email')}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    id="phoneNumber"
                    placeholder="Your phone number (optional)"
                    {...profileForm.register('phoneNumber')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formats: +1 (555) 123-4567, 555-123-4567, etc.
                  </p>
                  {profileForm.formState.errors.phoneNumber && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.phoneNumber.message}
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditProfileOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Change Password Dialog */}
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={passwordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword"
                    type="password"
                    placeholder="Your current password"
                    {...passwordForm.register('currentPassword')}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-500">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword"
                    type="password"
                    placeholder="Your new password"
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-500">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setChangePasswordOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Profile Picture Dialog */}
        <Dialog open={profilePictureDialogOpen} onOpenChange={setProfilePictureDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Profile Picture</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="profilePictureUrl">Profile Picture URL</Label>
                <Input 
                  id="profilePictureUrl"
                  placeholder="https://example.com/your-picture.jpg"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a valid URL to your profile picture (JPG, PNG, etc.)
                </p>
              </div>
              
              {profilePictureUrl && (
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profilePictureUrl} alt="Preview" />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProfilePictureDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={onProfilePictureSubmit}
                disabled={updateProfilePictureMutation.isPending}
              >
                {updateProfilePictureMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Picture"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
