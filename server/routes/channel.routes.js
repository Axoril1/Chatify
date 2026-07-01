import express from "express";
import Channel from "../models/Channel.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const channels = await Channel.find({
      $or: [{ type: "public" }, { members: req.user._id }],
    })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json({ channels });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch channels", error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Channel name is required" });

    const existing = await Channel.findOne({ name, type: "public" });
    if (existing) return res.status(409).json({ message: "Channel already exists" });

    const channel = await Channel.create({
      name,
      type: "public",
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({ channel });
  } catch (err) {
    res.status(500).json({ message: "Failed to create channel", error: err.message });
  }
});

router.post("/dm", requireAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: "targetUserId is required" });

    const existing = await Channel.findOne({
      type: "dm",
      members: { $all: [req.user._id, targetUserId] },
    });

    if (existing) return res.json({ channel: existing });

    const channel = await Channel.create({
      type: "dm",
      members: [req.user._id, targetUserId],
    });

    res.status(201).json({ channel });
  } catch (err) {
    res.status(500).json({ message: "Failed to create DM", error: err.message });
  }
});

export default router;