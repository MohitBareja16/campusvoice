import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import { UserModel, ClassModel } from '@/model/User';
import { User } from 'next-auth';
import { classSchema } from '@/schemas/classSchema';

// --- GET: Fetch all classes for the logged-in professor ---
export async function GET() {
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
    const professor = await UserModel.findById(user._id).populate('classes');

    if (!professor) {
      return Response.json(
        { success: false, message: 'Professor not found' },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'Classes fetched successfully',
        classes: professor.classes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching classes:', error);
    return Response.json(
      {
        success: false,
        message: 'An unexpected error occurred while fetching classes.',
      },
      { status: 500 }
    );
  }
}

// --- POST: Create a new class for the logged-in professor ---
export async function POST(request: Request) {
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
    const body = await request.json();
    const result = classSchema.safeParse(body);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => issue.message).join(', ');
      return Response.json(
        { success: false, message: `Invalid input: ${issues}` },
        { status: 400 }
      );
    }

    const { className, semester } = result.data;
    
    const professor = await UserModel.findById(user._id);
    if (!professor) {
        return Response.json(
            { success: false, message: 'Professor not found' },
            { status: 404 }
        );
    }

    // Create the new class
    const newClass = new ClassModel({
      className,
      semester,
      professor: professor._id, // Link to the professor
    });
    await newClass.save();

    // Add the new class's ID to the professor's classes array
    professor.classes.push(newClass._id as import('mongoose').Types.ObjectId);
    await professor.save();

    return Response.json(
      {
        success: true,
        message: 'Class created successfully',
        classes: newClass,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating class:', error);
    return Response.json(
      {
        success: false,
        message: 'An unexpected error occurred while creating the class.',
      },
      { status: 500 }
    );
  }
}
