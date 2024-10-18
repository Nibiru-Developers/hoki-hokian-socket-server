import mongoose from "mongoose";
import Env from "../utils/Env";

const connectDB = async () => {
  try {
    await mongoose.connect(Env.MONGO_URI);
    await mongoose.connection.dropCollection("users_in_lobbies");
    await mongoose.connection.dropCollection("rooms");

    console.log("MongoDB cleaned successfully");
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
