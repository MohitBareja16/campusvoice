import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { User } from 'next-auth';
import { updateProfileSchema } from '@/schemas/settingsSchema';
import { z } from 'zod';

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!session || !user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, email } = updateProfileSchema.parse(body);

    const userToUpdate = await UserModel.findById(user._id);

    if (!userToUpdate) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update the username (as 'name' from the form maps to 'username' in the model)
    userToUpdate.username = name;
    userToUpdate.email = email;
    await userToUpdate.save();

    return Response.json(
      {
        success: true,
        message: 'Profile updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, message: "Zod Error" },
        { status: 400 }
      );
    }
    console.error('Error updating profile:', error);
    return Response.json(
      { success: false, message: 'Error updating profile' },
      { status: 500 }
    );
  }
}
