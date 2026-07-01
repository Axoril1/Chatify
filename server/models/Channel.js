import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        trim: true 
    },
    type: { 
        type: String, 
        enum: ["public", "dm"], 
        default: "public" 
    },
    members: [
        { 
            type: mongoose.Schema.Types.ObjectId, ref: "User" 
        }
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