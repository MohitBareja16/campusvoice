import dbConnect from '@/lib/dbConnect';
import { FeedbackLinkModel, FeedbackSubmissionModel } from '@/model/User';
import { feedbackSubmissionSchema } from '@/schemas/feedbackSubmissionSchema';
import { z } from 'zod';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { content, token } = await request.json();

    // 1. Validate the incoming data
    const validationResult = feedbackSubmissionSchema.safeParse({ content });
    if (!validationResult.success) {
      const contentError = validationResult.error.format().content?._errors[0] ?? 'Invalid content provided.';
      return Response.json({ success: false, message: contentError }, { status: 400 });
    }

    // 2. Find the feedback link using the unique token
    const feedbackLink = await FeedbackLinkModel.findOne({ uniqueToken: token });

    if (!feedbackLink) {
      return Response.json({ success: false, message: 'Feedback link not found or is invalid.' }, { status: 404 });
    }

    // 3. Check if the link is active and can accept submissions
    if (feedbackLink.status !== 'ACTIVE') {
      return Response.json({ success: false, message: 'This feedback link is currently closed.' }, { status: 403 });
    }

    // 4. Create the new submission document
    const newSubmission = new FeedbackSubmissionModel({
      content: validationResult.data.content,
      feedbackLink: feedbackLink._id, // Link it to the parent
    });
    
    // Save the new submission to the database
    await newSubmission.save();

    // 5. IMPORTANT: Add the new submission's ID to the link's submissions array
    feedbackLink.submissions.push(newSubmission._id as any);
    
    // Save the updated feedback link document
    await feedbackLink.save();

    return Response.json(
      { success: true, message: 'Feedback submitted successfully.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in feedback submission route:', error);
    return Response.json(
      { success: false, message: 'An internal error occurred while submitting feedback.' },
      { status: 500 }
    );
  }
}

