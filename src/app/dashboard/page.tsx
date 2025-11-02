"use client"
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios, { AxiosError } from "axios";
import { useToast } from "@/hooks/use-toast";
import { ApiResponse, Class } from "@/types/ApiResponse";
import { CreateClassModal } from "@/components/CreateClassModal"; // You will create this component
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, BookOpen, Calendar } from "lucide-react"
import Link from "next/link"


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse>('/api/classes');
      setClasses(response.data.classes || []); // 👈 use "data"
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      // If user is not authenticated, show a clear message and don't keep retrying
      if (axiosError.response?.status === 401) {
        toast.error('Not authenticated', {
          description: 'Please sign in to view your classes.',
        });
        setClasses([]);
        return;
      }

      toast.error('Failed to fetch classes', {
        description: axiosError.response?.data.message ?? 'An error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Only fetch classes when the session is authenticated
    if (status === 'authenticated') {
      fetchClasses();
    }
  }, [fetchClasses, status]);

  const handleCreateClass = async (className: string, semester: string) => {
    try {
      await axios.post<ApiResponse>('/api/classes', { className, semester });
      toast.success('Class Created!', {
        description: `"${className}" has been successfully created.`,
      });
      fetchClasses(); // Re-fetch classes to update the list
      setIsModalOpen(false);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error('Failed to create class', {
        description: axiosError.response?.data.message ?? 'An error occurred.',
      });
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome back, {session?.user?.username || 'Professor'}!</h3>
          <p className="text-gray-600 mb-4">Manage your classes and collect anonymous feedback from students.</p>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create New Class
          </Button>
        </div>

        {/* My Classes section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                <p className="ml-2 text-gray-600">Loading your classes...</p>
              </div>
            ) : classes.length > 0 ? (
              classes.map((classItem) => (
                <Link key={classItem._id.toString()} href={`/dashboard/class/${classItem._id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {classItem.semester}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <CardTitle className="text-lg mb-1">{classItem.className}</CardTitle>
                      <CardDescription>{classItem.semester}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-gray-500 mb-4">You haven&apos;t created any classes yet.</p>
                <Button onClick={() => setIsModalOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Class
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <CreateClassModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreateClass={handleCreateClass}
      />
    </DashboardLayout>
  )
}
