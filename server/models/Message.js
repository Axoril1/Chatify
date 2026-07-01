import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    channelId: { 
        type: mongoose.Schema.Types.ObjectId, ref: "Channel", required: true 
    },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, ref: "User", required: true 
    },
    content: { 
        type: String, required: true, trim: true 
    },
    type: { 
        type: String, enum: ["text", "image", "ai"], default: "text" 
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
      },
    ],
    editedAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);