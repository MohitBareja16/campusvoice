import dbConnect from '@/lib/dbConnect';
import { FeedbackLinkModel } from '@/model/User';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  await dbConnect();

  try {
    const { token } = await params;

    if (!token) {
      return Response.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    const feedbackLink = await FeedbackLinkModel.findOne({
      uniqueToken: token,
    }).populate({
      path: 'class',
      select: 'className semester', // Select only the fields you need
    });

    if (!feedbackLink) {
      return Response.json(
        { success: false, message: 'Feedback link not found or is invalid' },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'Feedback link retrieved successfully.',
        link: feedbackLink,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching public feedback link:', error);
    return Response.json(
      {
        success: false,
        message: 'An error occurred while retrieving the feedback link.',
      },
      { status: 500 }
    );
  }
}

