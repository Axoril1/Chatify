import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken, cookieOptions } from "../lib/tokens.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: "Username or email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, status: "online" });

    const token = signToken(user._id);
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

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

export default router;