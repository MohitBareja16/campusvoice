import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import { UserModel } from '@/model/User';
import { User } from 'next-auth'; // The User type from next-auth is useful here

export async function GET(request: Request) {
  // 1. Connect to the database
  await dbConnect();

  // 2. Get the user session
  const session = await getServerSession(authOptions);
  const user: User | undefined = session?.user;

  // 3. Check if the user is authenticated
  if (!user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // 4. Find the user in the database by their ID from the session
    const foundUser = await UserModel.findById(user._id).select(
      '-password -verifyCode -verifyCodeExpiry' // Exclude sensitive fields
    );

    if (!foundUser) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // 5. Return the user's data
    return Response.json(
      {
        success: true,
        message: 'User profile fetched successfully',
        data: foundUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return Response.json(
      {
        success: false,
        message: 'An unexpected error occurred while fetching the user profile.',
      },
      { status: 500 }
    );
  }
}
