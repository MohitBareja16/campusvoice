"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { updateProfileSchema, updatePasswordSchema } from '@/schemas/settingsSchema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// ... other existing imports
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const toast = useToast();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Form for Profile Information
  const profileForm = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.username || '',
      email: session?.user?.email || '',
      department: '', // You would fetch this from your user model if it exists
    }
  });

  // Form for Security/Password
  const passwordForm = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (session) {
      profileForm.reset({
        name: session.user.username,
        email: session.user.email,
      });
    }
  }, [session, profileForm]);

  const handleUpdateProfile = async (data: z.infer<typeof updateProfileSchema>) => {
    setIsSavingProfile(true);
    try {
      // You'll need to create this API endpoint
      await axios.post('/api/user/update-profile', data);
      toast.success('Profile Updated', {
        description: 'Your profile information has been saved.',
      });
      // Update the session to reflect the new username
      await update({ username: data.name });
    } catch {
      toast.error('Update Failed', {
        description: 'Could not save your profile changes.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (data: z.infer<typeof updatePasswordSchema>) => {
    setIsUpdatingPassword(true);
    try {
      // You'll need to create this API endpoint
      await axios.post('/api/user/change-password', data);
      toast.success('Password Updated', {
        description: 'Your password has been changed successfully.',
      });
      passwordForm.reset(); // Clear the form fields
    } catch {
      toast.error('Update Failed', {
        description: 'Could not update your password. Please check your current password.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

    return (
    <DashboardLayout title="Settings">
      <div className="max-w-2xl space-y-8">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                <FormField
                  name="name"
                  control={profileForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="email"
                  control={profileForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@university.edu" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSavingProfile} className="bg-blue-600 hover:bg-blue-700">
                  {isSavingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your password and security settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
                <FormField
                  name="currentPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="newPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="confirmPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isUpdatingPassword} className='bg-blue-600 hover:bg-blue-700'>
                  {isUpdatingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Updating...</> : 'Update Password'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );

}