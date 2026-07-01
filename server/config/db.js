import mongoose from "mongoose";
import Channel from "../models/Channel.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    await seedDB();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const seedDB = async () => {
  const general = await Channel.findOne({ name: "general", type: "public" });
  if (!general) {
    await Channel.create({ name: "general", type: "public" });
    console.log("Created #general channel");
  }
};