import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import { ClassModel, FeedbackLinkModel } from '@/model/User';
import { User } from 'next-auth';
import { feedbackLinkSchema } from '@/schemas/feedbackLinkSchema';
import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'crypto';

// --- POST: Create a new feedback link for a specific class ---
export async function POST(
  request: Request,
  context : { params: Promise<{ classId: string }> }
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
    const { classId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return Response.json(
        { success: false, message: 'Invalid class ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = feedbackLinkSchema.safeParse(body);

    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => issue.message)
        .join(', ');
      return Response.json(
        { success: false, message: `Invalid input: ${issues}` },
        { status: 400 }
      );
    }

    const { title } = result.data;

    // Find the class and authorize the user
    const parentClass = await ClassModel.findById(classId);

    if (!parentClass) {
      return Response.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    if (parentClass.professor.toString() !== user._id) {
      return Response.json(
        {
          success: false,
          message: 'Unauthorized to add a feedback link to this class',
        },
        { status: 403 }
      );
    }

    // Create the new feedback link
    const newFeedbackLink = new FeedbackLinkModel({
      title,
      class: parentClass._id,
      professor: user._id,
      uniqueToken: randomUUID(),
      shareableLink: `${process.env.NEXTAUTH_URL}/feedback/${randomUUID()}`
    });
    await newFeedbackLink.save();

    // Add the new link's ID to the class's feedbackLinks array
    parentClass.feedbackLinks.push(newFeedbackLink._id as any);
    await parentClass.save();

    return Response.json(
      {
        success: true,
        message: 'Feedback link created successfully',
        data: newFeedbackLink,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating feedback link:', error);
    return Response.json(
      {
        success: false,
        message:
          'An unexpected error occurred while creating the feedback link.',
      },
      { status: 500 }
    );
  }
}
