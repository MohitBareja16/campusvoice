'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast"; // Using the specified path
import { signUpSchema } from "@/schemas/signUpSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from 'zod';
import { useDebounceCallback } from 'usehooks-ts';
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounced = useDebounceCallback(setUsername, 300);
  const toast = useToast();
  const router = useRouter();

  // Zod form implementation
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const checkUsernameUnique = async () => {
      if (username) {
        setIsCheckingUsername(true);
        setUsernameMessage(''); // Reset message
        try {
          const response = await axios.get(`/api/check-username-unique?username=${username}`);
          setUsernameMessage(response.data.message);
        } catch (error) {
          const axiosError = error as AxiosError<any>;
          setUsernameMessage(
            axiosError.response?.data.message ?? 'Error checking username'
          );
        } finally {
          setIsCheckingUsername(false);
        }
      }
    };
    checkUsernameUnique();
  }, [username]);

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/sign-up', data);

      toast.success('Registration successful!', {
        description: response.data.message,
      });

      router.replace(`/verify/${data.username}`);
      
    } catch (error) {
      console.error('Error in sign-up of user', error);
      const axiosError = error as AxiosError<any>;
      let errorMessage = axiosError.response?.data.message;
      
      toast.error('Sign-up failed.', {
        description: errorMessage ?? 'An unexpected error occurred.',
      });

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-gray-900">Create Professor Account</CardTitle>
          <CardDescription className="text-gray-600">
            Only accounts with a valid @university.edu email are permitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Enter your username"
                {...form.register('username')}
                onChange={(e) => {
                  form.setValue('username', e.target.value);
                  debounced(e.target.value);
                }}
              />
              {isCheckingUsername && <Loader2 className="animate-spin" />}
              {!isCheckingUsername && usernameMessage && (
                <p className={`text-sm ${usernameMessage === 'Username is unique' ? 'text-green-500' : 'text-red-500'}`}>
                    {usernameMessage}
                </p>
              )}
               <p className="text-red-500 text-sm">{form.formState.errors.username?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="professor@university.edu" 
                {...form.register('email')}
              />
               <p className="text-red-500 text-sm">{form.formState.errors.email?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password" 
                {...form.register('password')}
              />
               <p className="text-red-500 text-sm">{form.formState.errors.password?.message}</p>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Please Wait
                </>
              ) : ('Create Account')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-950 dark:text-gray-400">OR</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => signIn('google')}
            disabled={isSubmitting}
          >
            Sign up with Google
          </Button>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

