"use client"

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { ApiResponse, Class, FeedbackLink } from '@/types/ApiResponse';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DashboardLayout } from "@/components/dashboard-layout";
import { CreateLinkModal } from "@/components/create-link-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Copy, Eye, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function ClassDetailsPage() {
  const routeParams = useParams() as { classId?: string } | undefined;
  const classId = routeParams?.classId ?? undefined;
  const router = useRouter();
  const toast = useToast();

  const [classDetails, setClassDetails] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  const fetchClassDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`/api/classes/${classId}`);
      // Correctly access the 'classDetails' property from the API response
      setClassDetails(response.data.class || null);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error('Failed to fetch class details', {
        description: axiosError.response?.data.message ?? 'An unknown error occurred.',
      });
      // If class not found, redirect to dashboard
      if (axiosError.response?.status === 404) {
        router.replace('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  }, [classId, router, toast]);

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
    }
  }, [classId, fetchClassDetails]);

  const handleCreateLink = async (title: string) => {
    setIsCreatingLink(true);
    try {
      await axios.post<ApiResponse>(`/api/classes/${classId}/feedback-links`, { title });
      toast.success('Feedback Link Created', {
        description: `"${title}" has been created successfully.`,
      });
      fetchClassDetails(); // Refresh data
      setIsModalOpen(false);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
       toast.error('Creation Failed', {
        description: axiosError.response?.data.message ?? 'Could not create the link.',
      });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await axios.delete<ApiResponse>(`/api/feedback-links/${linkId}`);
      toast.info('Link Deleted', {
        description: 'The feedback link has been successfully deleted.',
      });
      fetchClassDetails(); // Refresh data
    } catch (error) {
       const axiosError = error as AxiosError<ApiResponse>;
       toast.error('Delete Failed', {
        description: axiosError.response?.data.message ?? 'Could not delete the link.',
      });
    }
  };

  const copyToClipboard = (token: string) => {
    // Construct the full URL to be copied
    const url = `${window.location.origin}/feedback/${token}`;
    navigator.clipboard.writeText(url);
    toast.info('Link Copied', {
      description: 'The shareable link has been copied to your clipboard.',
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading Class...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!classDetails) {
    return (
      <DashboardLayout title="Class Not Found">
        <div className="text-center py-12">
          <p className="text-gray-500">Could not find the requested class.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={classDetails.className}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{classDetails.className}</CardTitle>
            <CardDescription>{classDetails.semester}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Feedback Link
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Links</CardTitle>
            <CardDescription>Manage your feedback collection links for this class.</CardDescription>
          </CardHeader>
          <CardContent>
            {((classDetails.feedbackLinks as unknown) as FeedbackLink[]).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No feedback links created yet.</p>
                <Button onClick={() => setIsModalOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Link
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Shareable Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((classDetails.feedbackLinks as unknown) as FeedbackLink[]).map((link) => (
                    <TableRow key={String((link as unknown as { _id: unknown })._id)}>
                      <TableCell className="font-medium">{link.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700 max-w-xs truncate">
                            /feedback/{link.uniqueToken}
                          </code>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(link.uniqueToken)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={link.status === "ACTIVE" ? "default" : "secondary"}
                          className={
                            link.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {link.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{link.submissions.length}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/dashboard/link/${link._id}/submissions`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <a href={`/feedback/${link.uniqueToken}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this feedback link and all associated submissions. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteLink(String((link as unknown as { _id: unknown })._id))}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <CreateLinkModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen} 
          onCreateLink={handleCreateLink} 
          isSubmitting={isCreatingLink}
        />
      </div>
    </DashboardLayout>
  );
}

