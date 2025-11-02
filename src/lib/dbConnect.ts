import mongoose from 'mongoose';

// Define a type for our cached connection on the global object
type MongooseConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Augment the NodeJS Global type to include our mongoose cache
declare global {
  var mongoose: MongooseConnection;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Initialize the cache on the global object if it doesn't exist
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  // If a connection is already cached, return it immediately
  if (cached.conn) {
    console.log("Using cached database connection.");
    return cached.conn;
  }

  // If a connection promise is not already in progress, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Recommended for scalable applications
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("New database connection established.");
      return mongoose;
    });
  }
  
  try {
    // Await the connection promise and cache the successful connection
    cached.conn = await cached.promise;
  } catch (e) {
    // If connection fails, clear the promise to allow for a retry
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
