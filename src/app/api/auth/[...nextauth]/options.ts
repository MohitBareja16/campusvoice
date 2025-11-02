import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import { UserModel } from '@/model/User';

export const authOptions: NextAuthOptions = {
  providers: [
    // --- Google OAuth Provider ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // --- Credentials Provider (Email/Password) ---
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any): Promise<any> {
        await dbConnect();
        try {
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          });

          if (!user) {
            throw new Error('No user found with this email/username');
          }
          if (!user.isVerified) {
            throw new Error('Please verify your account before logging in');
          }
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (isPasswordCorrect) {
            return user;
          } else {
            throw new Error('Incorrect password');
          }
        } catch (err: any) {
          // The error message from the try block is passed here
          throw new Error(err.message || 'An error occurred during authorization');
        }
      },
    }),
  ],
  callbacks: {
    // --- signIn callback to handle domain verification for Google ---
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        await dbConnect();
        try {
          // Enforce that only emails from the allowed domain can sign in/up
          const ALLOWED_DOMAIN = 'university.edu';
          if (!profile?.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
            // Return false to deny access
            return false;
          }

          // Check if user already exists
          const existingUser = await UserModel.findOne({ email: profile.email });

          if (!existingUser) {
            // If user does not exist, create a new user
            const username = profile.email.split('@')[0]; // Create username from email
            
            // Create a new user document
            const newUser = new UserModel({
              username,
              email: profile.email,
              // For OAuth users, we can skip password, verifyCode etc.
              // We set isVerified to true because they've verified via Google
              isVerified: true, 
              classes: [],
            });
            await newUser.save();
          }
          // Allow the sign-in
          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          // Prevent sign-in on error
          return false;
        }
      }
      // Allow sign-in for other providers (like credentials)
      return true;
    },

    // --- JWT callback to add custom fields to the token ---
    async jwt({ token, user, trigger, session}) {
      if (user) {
        token._id = user._id?.toString();
        token.isVerified = user.isVerified;
        token.username = user.username;
      }
      if (trigger === "update" && session) {
        if (session.username) {
          token.username = session.username;
        }
      }
      return token;
    },
    
    // --- Session callback to add custom fields to the session object ---
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.isVerified = token.isVerified;
        session.user.username = token.username;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/sign-in',
  },
};
