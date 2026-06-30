import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true, 
        minlength: 3, 
        maxlength: 24 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    passwordHash: { 
        type: String, 
        required: true 
    },
    avatarUrl: { 
        type: String, 
        default: "" 
    },
    status: { 
        type: String, 
        enum: ["online", "offline", "away"], 
        default: "offline" 
    },
    lastSeen: { 
        type: Date, 
        default: Date.now 
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);