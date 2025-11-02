import dbConnect from '@/lib/dbConnect';
import { UserModel } from '@/model/User';
import bcrypt from 'bcryptjs';
import { signInSchema } from '@/schemas/signInSchema';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const result = signInSchema.safeParse(body);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => issue.message).join(', ');
      return Response.json(
        { success: false, message: `Invalid input: ${issues}` },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user by email or username
    const user = await UserModel.findOne({
      $or: [{ email: email }, { username: email }],
    });

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return Response.json(
        {
          success: false,
          message: 'Please verify your account before signing in',
        },
        { status: 403 } // 403 Forbidden
      );
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return Response.json(
        { success: false, message: 'Incorrect password' },
        { status: 401 } // 401 Unauthorized
      );
    }

    // At this point, credentials are valid
    return Response.json(
      {
        success: true,
        message: 'Sign-in successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error signing in user:', error);
    return Response.json(
      {
        success: false,
        message: 'An unexpected error occurred during sign-in.',
      },
      { status: 500 }
    );
  }
}
