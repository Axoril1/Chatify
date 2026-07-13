import express from "express";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate, summarizeSchema } from "../lib/validation.js";
import { aiLimiter } from "../lib/rateLimiters.js";
import { groq, AI_MODEL } from "../lib/groq.js";

const router = express.Router();

router.post("/:channelId", requireAuth, aiLimiter, validate(summarizeSchema), async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit } = req.body;

    const messages = await Message.find({ channelId, deletedAt: null })
      .populate("senderId", "username")
      .sort({ createdAt: -1 })
      .limit(limit);

    if (messages.length === 0) {
      return res.json({ summary: "No messages to summarize yet.", messageCount: 0 });
    }

    const transcript = messages
      .reverse()
      .map((m) => `${m.senderId.username}: ${m.content || "[attachment]"}`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "You summarize team chat conversations concisely. Produce a short summary as 3-6 bullet points covering key topics, decisions, and action items. Output only the bullet points, no preamble.",
        },
        { role: "user", content: `Summarize this conversation:\n\n${transcript}` },
      ],
    });

    const summary = completion.choices[0].message.content.trim();
    res.json({ summary, messageCount: messages.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to summarize", error: err.message });
  }
});

export default router;