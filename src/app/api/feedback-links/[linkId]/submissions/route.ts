import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Corrected path
import dbConnect from '@/lib/dbConnect';
import { FeedbackLinkModel, FeedbackSubmissionModel } from '@/model/User'; // Corrected path
import { User } from 'next-auth';
import mongoose from 'mongoose';

// --- GET: Fetch all submissions for a specific feedback link ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const user: User | undefined = session?.user;

  if (!user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // FIX: Access params directly, it is not a promise.
  const { linkId } = await params;
    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      return Response.json(
        { success: false, message: 'Invalid feedback link ID' },
        { status: 400 }
      );
    }

    // Authorization check: Verify the link belongs to the logged-in professor.
    const feedbackLink = await FeedbackLinkModel.findById(linkId);

    if (!feedbackLink) {
      return Response.json(
        { success: false, message: 'Feedback link not found' },
        { status: 404 }
      );
    }

    // FIX: Use the 'owner' field from the schema for authorization check.
    if (feedbackLink.professor.toString() !== user._id) {
      return Response.json(
        {
          success: false,
          message: 'Unauthorized to view submissions for this link',
        },
        { status: 403 }
      );
    }

    // If authorized, fetch all related submissions.
    const submissions = await FeedbackSubmissionModel.find({
      feedbackLink: linkId,
    }).sort({ createdAt: -1 }); // Sort by newest first (using 'createdAt' from schema)
    console.log(submissions);


    return Response.json(
      {
        success: true,
        message: 'Submissions fetched successfully',
        // FIX: Send data in a 'submissions' property to match frontend expectations.
        submissions: submissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return Response.json(
      {
        success: false,
        message: 'An unexpected error occurred while fetching submissions.',
      },
      { status: 500 }
    );
  }
}

