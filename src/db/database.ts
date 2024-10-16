import mongoose from "mongoose";
import Env from "../utils/Env";

const connectDB = async () => {
  try {
    await mongoose.connect(Env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
