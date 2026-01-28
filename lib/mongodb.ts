import mongoose from "mongoose";

type connectionObject = {
  isConnected?: number;
};

const connection: connectionObject = {};

export async function connectToDatabase(): Promise<void> {
  if (connection?.isConnected) {
    console.log("Already connected to database", connection?.isConnected);
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || "");

    connection.isConnected = db.connections[0].readyState;

    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to database", error);
    process.exit(1);
  }
}
