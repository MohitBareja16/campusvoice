'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { verifySchema } from "@/schemas/verifySchema";
import { ApiResponse } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from 'zod';

export default function VerifyPage() {
  const router = useRouter();
  // The username is extracted from the URL path
  const params = useParams<{ username: string }>();
  const { username } = params;
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with zod for validation
  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });

  // Handler for form submission
  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post<ApiResponse>('/api/verify-code', {
        username: username,
        code: data.code,
      });

      toast.success("Verification Successful", {
        description: response.data.message,
      });

      // Redirect to the sign-in page upon successful verification
      router.replace('/sign-in');

    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error("Verification Failed", {
        description: axiosError.response?.data.message ?? 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-gray-900">Verify Your Account</CardTitle>
          {/* Decode the username in case it contains special characters */}
          <CardDescription className="text-gray-600">
            Enter the code sent to your email for user: <strong>{decodeURIComponent(username)}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="code"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="code">Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        id="code"
                        placeholder="123456"
                        className="text-center text-lg tracking-widest"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

