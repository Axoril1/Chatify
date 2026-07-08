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
        type: String, trim: true, default: ""
    },
    type: { 
        type: String, enum: ["text", "image", "file", "ai"], default: "text" 
    },
    attachment: {
      url: String,
      publicId: String,
      fileName: String,
      fileType: String,
      fileSize: Number,
      resourceType: String,
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

messageSchema.pre("validate", function () {
  if (!this.content?.trim() && !this.attachment?.url) {
    throw new Error("Message must have content or an attachment");
  }
});

export default mongoose.model("Message", messageSchema);