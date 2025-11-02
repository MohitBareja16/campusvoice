"use client"

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation'; // Import the correct hook
import { useToast } from '@/hooks/use-toast';
import axios, { AxiosError } from 'axios';
import { ApiResponse, FeedbackLink, FeedbackSubmission } from '@/types/ApiResponse';
import { Loader2 } from 'lucide-react';

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

// Page no longer receives props, it gets params from the hook
export default function SubmissionsPage() {
  // FIX: Get dynamic parameters using the useParams hook
  const params = useParams<{ linkId: string }>();
  const linkId = params.linkId;

  const toast = useToast();
  const [linkDetails, setLinkDetails] = useState<FeedbackLink | null>(null);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [linkDetailsResponse, submissionsResponse] = await Promise.all([
        axios.get(`/api/feedback-links/${linkId}`),
        axios.get(`/api/feedback-links/${linkId}/submissions`),
      ]);
      // FIX: Access the 'link' property from the response, not 'feedbackLink'
      setLinkDetails(linkDetailsResponse.data.link || null);
      setSubmissions(submissionsResponse.data.submissions || []);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error('Failed to fetch data', {
        description: axiosError.response?.data.message ?? 'An error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    if(linkId) {
      fetchData();
    }
  }, [linkId, fetchData]);

  function formatRelativeTime(dateString: string | Date): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Loading Submissions...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!linkDetails) {
    return (
      <DashboardLayout title="Submissions Not Found">
        <div className="text-center py-12">
          <p className="text-gray-500">Feedback link not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={linkDetails.title}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/class/${linkDetails.class}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Class
            </Link>
          </Button>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {submissions.length} submissions
          </Badge>
        </div>

        <div className="space-y-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No submissions yet</p>
                <p className="text-sm text-gray-400">
                  Share your feedback link with students to start collecting responses.
                </p>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card key={(submission._id as any).toString()} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">Anonymous Feedback</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      Submitted {formatRelativeTime(submission.createdAt)}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{submission.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

