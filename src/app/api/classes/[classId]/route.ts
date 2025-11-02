// ... other imports
import { ClassModel, FeedbackLinkModel } from '@/model/User'; // Ensure models are imported
import { User } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';

export async function GET(request: Request, context: { params: Promise<{ classId: string }> }) {
  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!session || !user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }
  await dbConnect();
  const { classId } =  await context.params;
  console.log("Fetching details for Class ID:", classId);

  try {
    // The key is to ensure the model used for population is imported and registered.

    const classDetails = await ClassModel.findById(classId)
      .populate({
        path: 'feedbackLinks',
        model: FeedbackLinkModel, // Explicitly provide the model to use for population
      })
      .exec();

    if (!classDetails || !classDetails.professor.equals(user._id)) {
      return Response.json(
        { success: false, message: "Class not found or you are not the owner" },
        { status: 404 }
    );
  }


    return Response.json(
      {
        success: true,
        message: 'Class details fetched successfully',
        class: classDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('An error occurred while fetching class details:', error);
    return Response.json(
      { success: false, message: 'Error fetching class details' },
      { status: 500 }
    );
  }
}