import express from "express";
import Channel from "../models/Channel.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate, channelCreateSchema, inviteSchema, dmCreateSchema } from "../lib/validation.js";
import { resolveInvites } from "../lib/inviteResolver.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const channels = await Channel.find({ members: req.user._id })
      .populate("lastMessage")
      .populate("members", "username email avatarUrl status")
      .populate("createdBy", "username")
      .sort({ updatedAt: -1 });

    res.json({ channels });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch channels", error: err.message});
  }
});

router.post("/", requireAuth, validate(channelCreateSchema), async (req, res) => {
  try {
    const { name, invites } = req.body;

    const { userIds, pendingInvites, notFoundUsernames } = await resolveInvites(invites, req.user.email);

    if (notFoundUsernames.length > 0) {
      return res.status(400).json({
        message: `No account found for username(s): ${notFoundUsernames.join(", ")}`,
      });
    }

    const memberIds = new Set([req.user._id.toString(), ...userIds]);

    const channel = await Channel.create({
      name,
      type: "group",
      createdBy: req.user._id,
      members: [...memberIds],
      pendingInvites,
    });

    const populated = await channel.populate([
      { path: "members", select: "username email avatarUrl status" },
      { path: "createdBy", select: "username" },
    ]);

    res.status(201).json({ channel: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create group", error: err.message});
  }
});

router.post("/:id/invite", requireAuth, validate(inviteSchema), async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: "Group not found" });
    if (channel.type !== "group") {
      return res.status(400).json({ message: "Can only invite members to groups" });
    }
    if (channel.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the group creator can add members" });
    }

    const { invites } = req.body;
    const { userIds, pendingInvites, notFoundUsernames } = await resolveInvites(invites, req.user.email);

    if (notFoundUsernames.length > 0) {
      return res.status(400).json({
        message: `No account found for username(s): ${notFoundUsernames.join(", ")}`,
      });
    }

    const existingMemberIds = new Set(channel.members.map((id) => id.toString()));
    const newMemberIds = userIds.filter((id) => !existingMemberIds.has(id));
    const newPendingInvites = pendingInvites.filter((email) => !channel.pendingInvites.includes(email));

    channel.members.push(...newMemberIds);
    channel.pendingInvites.push(...newPendingInvites);
    await channel.save();

    const populated = await channel.populate([
      { path: "members", select: "username email avatarUrl status" },
      { path: "createdBy", select: "username" },
    ]);

    res.json({ channel: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to add members", error: err.message });
  }
});

router.post("/dm", requireAuth, validate(dmCreateSchema), async (req, res) => {
  try {
    const { targetUserId } = req.body;

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