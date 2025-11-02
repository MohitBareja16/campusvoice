import mongoose, { Schema, Document, Types } from 'mongoose';

// --- INTERFACES ---

export interface FeedbackSubmission extends Document {
  content: string;
  feedbackLink: Types.ObjectId;
  createdAt: Date;
}

export interface FeedbackLink extends Document {
  title: string;
  uniqueToken: string;
  status: 'ACTIVE' | 'CLOSED';
  class: Types.ObjectId;
  professor: Types.ObjectId;
  submissions: Types.ObjectId[];
  createdAt: Date;
  shareableLink: string; // Virtual field for the shareable link
}

export interface Class extends Document {
  _id:Types.ObjectId;
  className: string;
  semester: string;
  professor: Types.ObjectId;      // 👈 reference to User/Professor
  feedbackLinks: FeedbackLink[];
  createdAt: Date;
}

export interface User extends Document {
  username: string;
  email: string;
  password: string;
  verifyCode: string;
  verifyCodeExpiry: Date;
  isVerified: boolean;
  classes: Types.ObjectId[];
}

// --- SCHEMAS ---

const FeedbackSubmissionSchema: Schema<FeedbackSubmission> = new Schema({
  content: {
    type: String,
    required: true,
  },
  feedbackLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedbackLink',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FeedbackLinkSchema: Schema<FeedbackLink> = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  uniqueToken: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'CLOSED'],
    default: 'ACTIVE',
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  submissions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackSubmission',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ClassSchema: Schema<Class> = new Schema({
  className: {
    type: String,
    required: true,
    trim: true,
  },
  semester: {
    type: String,
    trim: true,
  },
  professor: {
    type: Schema.Types.ObjectId,
    ref: 'Professor',
    required: true,
  },
  // --- THIS IS THE FIX ---
  // The 'ref' property tells Mongoose which model to look at during .populate()
  feedbackLinks: [
    {
      type: Schema.Types.ObjectId,
      ref: 'FeedbackLink',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const UserSchema: Schema<User> = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^[^@]+@[^@]+\.[^@]+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  verifyCode: {
    type: String,
    required: [true, 'Verify Code is required'],
  },
  verifyCodeExpiry: {
    type: Date,
    required: [true, 'Verify Code Expiry is required'],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  classes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
  ],
});


// --- MODELS ---
// Use existing models if they exist, otherwise create them. This prevents errors during hot-reloading.
export const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>('User', UserSchema);
export const ClassModel = (mongoose.models.Class as mongoose.Model<Class>) || mongoose.model<Class>('Class', ClassSchema);
export const FeedbackLinkModel = (mongoose.models.FeedbackLink as mongoose.Model<FeedbackLink>) || mongoose.model<FeedbackLink>('FeedbackLink', FeedbackLinkSchema);
export const FeedbackSubmissionModel = (mongoose.models.FeedbackSubmission as mongoose.Model<FeedbackSubmission>) || mongoose.model<FeedbackSubmission>('FeedbackSubmission', FeedbackSubmissionSchema);


export default UserModel;