import type { Class, FeedbackLink, FeedbackSubmission } from "@/model/User";

// Re-export the imported types. This makes them available to any other file
// that imports from this module, resolving the error.
export type { Class, FeedbackLink, FeedbackSubmission };

export interface ApiResponse {
  success: boolean;
  message: string;
  classes?: Class[];
  class?: Class;
  feedbackLink?: FeedbackLink;
  submissions?: FeedbackSubmission[];
};

