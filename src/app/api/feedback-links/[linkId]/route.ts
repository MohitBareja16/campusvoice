import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Corrected path
import dbConnect from '@/lib/dbConnect';
import {
  ClassModel,
  FeedbackLinkModel,
  FeedbackSubmissionModel,
} from '@/model/User'; // Corrected path
import { User } from 'next-auth';
import { feedbackLinkSchema } from '@/schemas/feedbackLinkSchema';
import mongoose from 'mongoose';

// --- GET: Fetch a single feedback link by its ID ---
export async function GET(
  request: Request,
  { params }: { params: { linkId: string } } // Corrected signature
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
    const { linkId } = params; // Corrected access
    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      return Response.json(
        { success: false, message: 'Invalid link ID' },
        { status: 400 }
      );
    }

    const feedbackLink = await FeedbackLinkModel.findById(linkId);

    if (!feedbackLink) {
      return Response.json(
        { success: false, message: 'Feedback link not found' },
        { status: 404 }
      );
    }

    // FIX: Authorization check using the 'owner' field from the schema
    if (feedbackLink.professor.toString() !== user._id) {
      return Response.json(
        { success: false, message: 'Unauthorized to view this feedback link' },
        { status: 403 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'Feedback link fetched successfully',
        // FIX: Return data in 'link' property to match frontend expectations
        link: feedbackLink,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching feedback link:', error);
    return Response.json(
      {
        success: false,
        message:
          'An unexpected error occurred while fetching the feedback link.',
      },
      { status: 500 }
    );
  }
}

// --- PUT: Update a specific feedback link ---
export async function PUT(
  request: Request,
  { params }: { params: { linkId: string } } // Corrected signature
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
    const { linkId } = params; // Corrected access
    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      return Response.json(
        { success: false, message: 'Invalid link ID' },
        { status: 400 }
      );
    }

    const { title, status } = await request.json();

    if (title !== undefined) {
        const result = feedbackLinkSchema.safeParse({ title });
        if (!result.success) {
            const issues = result.error.issues.map((issue) => issue.message).join(', ');
            return Response.json(
                { success: false, message: `Invalid title: ${issues}` },
                { status: 400 }
            );
        }
    }
     if (status !== undefined && !['ACTIVE', 'CLOSED'].includes(status)) {
        return Response.json(
            { success: false, message: 'Invalid status value' },
            { status: 400 }
        );
    }

    const linkToUpdate = await FeedbackLinkModel.findById(linkId);

    if (!linkToUpdate) {
      return Response.json(
        { success: false, message: 'Feedback link not found' },
        { status: 404 }
      );
    }

    // FIX: Authorization check using the 'professor' field
    if (linkToUpdate.professor.toString() !== user._id) {
      return Response.json(
        { success: false, message: 'Unauthorized to update this link' },
        { status: 403 }
      );
    }

    if (title !== undefined) linkToUpdate.title = title;
    if (status !== undefined) linkToUpdate.status = status;
    
    await linkToUpdate.save();

    return Response.json(
      {
        success: true,
        message: 'Feedback link updated successfully',
        link: linkToUpdate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating feedback link:', error);
    return Response.json(
      {
        success: false,
        message:
          'An unexpected error occurred while updating the feedback link.',
      },
      { status: 500 }
    );
  }
}

// --- DELETE: Delete a specific feedback link and its submissions ---
export async function DELETE(
  request: Request,
  { params }: { params: { linkId: string } } // Corrected signature
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

  const transactionSession = await mongoose.startSession();
  try {
    transactionSession.startTransaction();
    const { linkId } = params; // Corrected access

    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      await transactionSession.abortTransaction();
      return Response.json(
        { success: false, message: 'Invalid link ID' },
        { status: 400 }
      );
    }

    const linkToDelete = await FeedbackLinkModel.findById(linkId).session(
      transactionSession
    );

    if (!linkToDelete) {
      await transactionSession.abortTransaction();
      return Response.json(
        { success: false, message: 'Feedback link not found' },
        { status: 404 }
      );
    }

    // FIX: Authorization check using the 'professor' field
    if (linkToDelete.professor.toString() !== user._id) {
      await transactionSession.abortTransaction();
      return Response.json(
        { success: false, message: 'Unauthorized to delete this link' },
        { status: 403 }
      );
    }

    // Delete all submissions for this link
    await FeedbackSubmissionModel.deleteMany({
      feedbackLink: linkId,
    }).session(transactionSession);

    // Remove the link from the parent class's list
    await ClassModel.updateOne(
      { _id: linkToDelete.class },
      { $pull: { feedbackLinks: linkId } }
    ).session(transactionSession);

    // Delete the link itself
    await linkToDelete.deleteOne({ session: transactionSession });

    await transactionSession.commitTransaction();

    return Response.json(
      {
        success: true,
        message: 'Feedback link and all its submissions deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    await transactionSession.abortTransaction();
    console.error('Error deleting feedback link:', error);
    return Response.json(
      {
        success: false,
        message: 'An error occurred during link deletion.',
      },
      { status: 500 }
    );
  } finally {
    await transactionSession.endSession();
  }
}

