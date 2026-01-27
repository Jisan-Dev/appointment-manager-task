import mongoose, { Connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cachedConnection: Connection | null = null;

export async function connectToDatabase(): Promise<Connection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
    });

    cachedConnection = conn.connection;
    return cachedConnection;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}
