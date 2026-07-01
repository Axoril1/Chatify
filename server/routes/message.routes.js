import express from "express";
import Message from "../models/Message.js";
import Channel from "../models/Channel.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { io } from "../server.js";

const router = express.Router();

router.get("/:channelId", requireAuth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { before, limit = 30 } = req.query;

    const query = { channelId, deletedAt: null };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .populate("senderId", "username avatarUrl status")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages", error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { channelId, content } = req.body;
    if (!channelId || !content) {
      return res.status(400).json({ message: "channelId and content are required" });
    }

    const message = await Message.create({
      channelId,
      senderId: req.user._id,
      content,
    });

    const populated = await message.populate("senderId", "username avatarUrl status");

    await Channel.findByIdAndUpdate(channelId, { lastMessage: message._id });

    io.to(channelId).emit("message:new", populated);

    res.status(201).json({ message: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to send message", error: err.message });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your message" });
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();

    const populated = await message.populate("senderId", "username avatarUrl status");
    io.to(message.channelId.toString()).emit("message:updated", populated);

    res.json({ message: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to edit message", error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your message" });
    }

    message.deletedAt = new Date();
    await message.save();

    io.to(message.channelId.toString()).emit("message:deleted", { messageId: message._id });

    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete message", error: err.message });
  }
});

export default router;