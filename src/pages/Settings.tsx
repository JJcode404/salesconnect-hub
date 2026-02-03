import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout, PageContainer } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building, Lock, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { user, organization, updateProfile, changePassword, hasRole } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const isOwner = hasRole(['OWNER']);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      await updateProfile(profileData);
      toast({ title: 'Profile updated' });
    } catch (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setIsUpdating(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast({ title: 'Password changed' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({ title: 'Failed to change password', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AppLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader title="Settings" description="Manage your account and organization settings." />

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger value="organization" className="gap-2">
                  <Building className="h-4 w-4" />
                  Organization
                </TabsTrigger>
              )}
              <TabsTrigger value="security" className="gap-2">
                <Lock className="h-4 w-4" />
                Security
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing
                </TabsTrigger>
              )}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="text-lg">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <StatusBadge variant="brand" className="mt-2">{user?.role}</StatusBadge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData((p) => ({ ...p, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData((p) => ({ ...p, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-lg">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">
                      Contact support to change your email address.
                    </p>
                  </div>

                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="bg-brand text-brand-foreground hover:bg-brand-hover"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Organization Tab */}
            {isOwner && (
              <TabsContent value="organization">
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Manage your organization settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2 max-w-lg">
                      <Label>Organization Name</Label>
                      <Input value={organization?.name} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2 max-w-lg">
                      <Label>Plan</Label>
                      <div className="flex items-center gap-2">
                        <Input value={organization?.plan} disabled className="bg-muted" />
                        <StatusBadge variant="success" dot>
                          {organization?.subscriptionStatus}
                        </StatusBadge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contact support to change your organization name or upgrade your plan.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={isUpdating || !passwordData.currentPassword || !passwordData.newPassword}
                    className="bg-brand text-brand-foreground hover:bg-brand-hover"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Password'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            {isOwner && (
              <TabsContent value="billing">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing & Subscription</CardTitle>
                    <CardDescription>Manage your subscription and payment methods.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border p-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{organization?.plan} Plan</p>
                          <p className="text-sm text-muted-foreground">
                            {organization?.messagesUsed.toLocaleString()} / {organization?.messageLimit.toLocaleString()} messages used
                          </p>
                        </div>
                        <StatusBadge variant="success" dot>
                          {organization?.subscriptionStatus}
                        </StatusBadge>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline">Manage Subscription</Button>
                      <Button variant="outline">View Invoices</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
