import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        trim: true 
    },
    type: { 
        type: String, 
        enum: ["group", "dm"], 
        default: "group" 
    },
    members: [
        { 
            type: mongoose.Schema.Types.ObjectId, ref: "User" 
        }
    ],
    pendingInvites: [
      { type: String, trim: true, lowercase: true }
    ],
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    },
    lastMessage: { 
        type: mongoose.Schema.Types.ObjectId, ref: "Message" 
    },
  },
  { timestamps: true }
);

export default mongoose.model("Channel", channelSchema);