"use client"

import { useState, useEffect, useCallback } from "react";
import { useParams } from 'next/navigation';
import { useSession, signIn } from "next-auth/react";
import axios, { AxiosError } from 'axios';
import { ApiResponse, FeedbackLink } from "@/types/ApiResponse";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, University, MessageSquare, Loader2 } from "lucide-react";

// FIX: Define the ViewState type
type ViewState = "loading" | "auth-gate" | "feedback-form" | "success" | "error";

export default function FeedbackPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data: session } = useSession();
  const toast = useToast();
  
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [linkInfo, setLinkInfo] = useState<FeedbackLink | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLinkInfo = useCallback(async () => {
    setViewState("loading");
    try {
      const response = await axios.get(`/api/feedback-links/public/${token}`);
      // FIX: Access the 'link' property from the response, not 'feedbackLink'
      const linkData = response.data.link;

      if (!linkData || linkData.status !== "ACTIVE") {
        setViewState("error");
        return;
      }
      
      setLinkInfo(linkData);
      if (session?.user) {
        setViewState("feedback-form");
      } else {
        setViewState("auth-gate");
      }
    } catch (error) {
      console.error("Error fetching link info:", error);
      setViewState("error");
    }
  }, [token, session]);

  useEffect(() => {
    if (token) {
      fetchLinkInfo();
    }
  }, [token, fetchLinkInfo]);

  useEffect(() => {
    if (session?.user && viewState === 'auth-gate') {
       toast.success("Authentication Successful",{
        description: "You can now submit anonymous feedback.",
      });
      setViewState('feedback-form');
    }
  }, [session, viewState, toast]);


  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error("Feedback Required",{
        description: "Please enter your feedback before submitting."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(feedback)
      await axios.post<ApiResponse>('/api/feedback-submissions', {
        content: feedback.trim(),
        token,
      });
      setViewState("success");
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error("Submission Failed",{
        description: axiosError.response?.data.message ?? "Failed to submit feedback. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (viewState === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading feedback form...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewState === "error" || !linkInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Feedback Link Not Available</h2>
            <p className="text-gray-600 mb-4">
              This feedback link is either invalid, expired, or has been closed by the professor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback for {linkInfo.title}</h1>
          <div className="flex items-center justify-center space-x-2">
            {(() => {
              const classInfo = linkInfo.class as { className?: string; semester?: string } | undefined;
              return (
                <>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">{classInfo?.className}</Badge>
                  <Badge variant="outline">{classInfo?.semester}</Badge>
                </>
              );
            })()}
          </div>
        </div>

        {viewState === "auth-gate" && (
          <Card className="w-full animate-fade-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl">Verify Your Identity</CardTitle>
              <CardDescription className="text-base">
                To ensure feedback is from students, please sign in with your official university ID.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Button onClick={() => signIn('google')} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                <University className="w-5 h-5 mr-2" />
                Sign in with University ID
              </Button>
              <p className="text-sm text-gray-500">
                Your email is used for a one-time verification and is NOT linked to your submission.
              </p>
            </CardContent>
          </Card>
        )}

        {viewState === "feedback-form" && (
          <Card className="w-full animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl text-center">Submit Anonymous Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter your constructive feedback here..."
                  className="min-h-[200px] text-base leading-relaxed"
                  maxLength={2000}
                />
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Your feedback will be completely anonymous.</span>
                  <span>{feedback.length}/2000</span>
                </div>
              </div>

              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !feedback.trim()}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Submitting...</>
                ) : (
                  <><MessageSquare className="w-4 h-4 mr-2" /> Submit Anonymously</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {viewState === "success" && (
          <Card className="w-full animate-fade-in">
            <CardContent className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600 mb-4">Your feedback has been submitted successfully.</p>
              <p className="text-sm text-gray-500">
                Your anonymous feedback will help improve the course experience for everyone.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

