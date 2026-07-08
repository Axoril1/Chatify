import mongoose from "mongoose";

const automationRuleSchema = new mongoose.Schema(
  {
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: "Channel", required: true },
    keyword: { type: String, required: true, trim: true, lowercase: true },
    response: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("AutomationRule", automationRuleSchema);