import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import { UserModel } from '@/model/User';
import { User } from 'next-auth';
import { updatePasswordSchema } from '@/schemas/settingsSchema';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const user: User | undefined = session?.user;

  if (!session || !user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = updatePasswordSchema.parse(body);

    const userToUpdate = await UserModel.findById(user._id);

    if (!userToUpdate) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has a password (they might have signed up with Google)
    if (!userToUpdate.password) {
        return Response.json(
            { success: false, message: 'Cannot change password for accounts signed in with Google.' },
            { status: 400 }
        );
    }

    // 1. Verify the current password
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      userToUpdate.password
    );

    if (!isPasswordCorrect) {
      return Response.json(
        { success: false, message: 'Incorrect current password' },
        { status: 403 } // 403 Forbidden is more appropriate than 400
      );
    }

    // 2. Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update the password in the database
    userToUpdate.password = hashedNewPassword;
    await userToUpdate.save();

    return Response.json(
      {
        success: true,
        message: 'Password updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // const errorMessage = error.errors[0]?.message || 'Invalid input provided.';
      return Response.json(
        { success: false, message: 'Invalid input provided.' },
        { status: 400 }
      );
    }
    console.error('Error updating password:', error);
    return Response.json(
      { success: false, message: 'Error updating password' },
      { status: 500 }
    );
  }
}

