import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Channel from "../models/Channel.js";
import { signToken, cookieOptions } from "../lib/tokens.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate, signupSchema, loginSchema, profileUpdateSchema, passwordChangeSchema } from "../lib/validation.js";
import { authLimiter } from "../lib/rateLimiters.js";

const router = express.Router();

router.post("/signup", authLimiter, validate(signupSchema), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: "Username or email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, status: "online" });

    // Resolve any pending group invites that were sent to this email before signup
    await Channel.updateMany(
      { pendingInvites: email },
      { $addToSet: { members: user._id }, $pull: { pendingInvites: email } }
    );

    const token = signToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    user.status = "online";
    user.lastSeen = new Date();
    await user.save();

    const token = signToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.json({
      user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

router.post("/logout", requireAuth, async (req, res) => {
  req.user.status = "offline";
  req.user.lastSeen = new Date();
  await req.user.save();
  res.clearCookie("token", cookieOptions);
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

router.patch("/me", requireAuth, validate(profileUpdateSchema), async (req, res) => {
  try {
    const { username, email, avatarUrl } = req.body;

    if (username && username !== req.user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(409).json({ message: "Username already taken" });
      req.user.username = username;
    }

    if (email && email !== req.user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ message: "Email already in use" });
      req.user.email = email;
    }

    if (avatarUrl !== undefined) {
      req.user.avatarUrl = avatarUrl;
    }

    await req.user.save();

    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

router.patch("/me/password", requireAuth, validate(passwordChangeSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update password", error: err.message });
  }
});

export default router;