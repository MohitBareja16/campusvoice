import dbConnect from '@/lib/dbConnect';
import { UserModel } from '@/model/User'; // Adjusted import to match our new structure
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/helpers/sendVerificationEmail';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, email, password } = await request.json();

    // --- Domain Verification Start ---
    // Enforce that only emails from a specific domain can register.
    // TODO: Move 'university.edu' to an environment variable (.env.local) for security and flexibility.
    // For example: process.env.ALLOWED_EMAIL_DOMAIN
    const ALLOWED_DOMAIN = 'gmail.com';

    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return Response.json(
        {
          success: false,
          message:
            'Registration failed. Only professors with a valid university email are allowed to register.',
        },
        { status: 403 } // 403 Forbidden is more appropriate than 400
      );
    }
    // --- Domain Verification End ---

    // Check if a user with the same username already exists and is verified
    const existingVerifiedUserByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingVerifiedUserByUsername) {
      return Response.json(
        {
          success: false,
          message: 'Username is already taken',
        },
        { status: 400 }
      );
    }

    const existingUserByEmail = await UserModel.findOne({ email });
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(verifyCode)
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1); // 1-hour expiry

    if (existingUserByEmail) {
      // If the user exists but is not verified, we'll update their details and resend the verification
      if (existingUserByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: 'User already exists with this email',
          },
          { status: 400 }
        );
      } else {
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = expiryDate;
        await existingUserByEmail.save();
      }
    } else {
      // Create a new user if one doesn't exist with that email
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        classes: [], // Initialize with an empty array of classes
      });

      await newUser.save();
    }

    // Send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );

    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'User registered successfully. Please verify your account.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return Response.json(
      {
        success: false,
        message: 'An unexpected error occurred while registering.',
      },
      { status: 500 }
    );
  }
}

