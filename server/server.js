import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import messageRoutes from "./routes/message.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import automationRoutes from "./routes/automation.routes.js";
import summarizeRoutes from "./routes/summarize.routes.js";
import User from "./models/User.js";
import Message from "./models/Message.js";
import Channel from "./models/Channel.js";
import AutomationRule from "./models/AutomationRule.js";
import { groq, AI_MODEL, VISION_MODEL } from "./lib/groq.js";
import { apiLimiter } from "./lib/rateLimiters.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/automations", automationRoutes);
app.use("/api/summarize", summarizeRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: "Something went wrong" });
});

io.use((socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) return next(new Error("No cookie"));
    const tokenMatch = cookie.match(/token=([^;]+)/);
    if (!tokenMatch) return next(new Error("No token"));
    const decoded = jwt.verify(tokenMatch[1], process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

const broadcastOnlineUsers = async () => {
  const sockets = await io.fetchSockets();
  const onlineUserIds = [...new Set(sockets.map((s) => s.userId))];
  io.emit("users:online", onlineUserIds);
};

let aiBotUser = null;

const ensureAIBotUser = async () => {
  let bot = await User.findOne({ username: "AI Assistant" });
  if (!bot) {
    bot = await User.create({
      username: "AI Assistant",
      email: "ai-assistant@chatify.local",
      passwordHash: "not-a-real-account-no-login",
      status: "online",
    });
  }
  return bot;
};

const messageRateLimits = new Map(); 
const MESSAGE_WINDOW_MS = 5000;
const MESSAGE_MAX_PER_WINDOW = 8;

const isMessageRateLimited = (socketId) => {
  const now = Date.now();
  const timestamps = (messageRateLimits.get(socketId) || []).filter(
    (t) => now - t < MESSAGE_WINDOW_MS
  );
  timestamps.push(now);
  messageRateLimits.set(socketId, timestamps);
  return timestamps.length > MESSAGE_MAX_PER_WINDOW;
};

const aiCooldowns = new Map(); // userId -> last request timestamp
const AI_COOLDOWN_MS = 8000;

const isAiOnCooldown = (userId) => {
  const last = aiCooldowns.get(userId);
  const now = Date.now();
  if (last && now - last < AI_COOLDOWN_MS) return true;
  aiCooldowns.set(userId, now);
  return false;
};

const handleAIRequest = async (channelId, prompt, imageUrl) => {
  const streamId = `ai-${Date.now()}`;
  io.to(channelId).emit("ai:start", { streamId });

  let fullText = "";
  try {
    const userContent = imageUrl
      ? [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ]
      : prompt;

    const completionParams = {
      model: imageUrl ? VISION_MODEL : AI_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant embedded in a team chat app called Chatify. Keep answers concise and friendly. If an image is provided, describe and analyze it as part of your answer.",
        },
        { role: "user", content: userContent },
      ],
      stream: true,
    };

    if (imageUrl) {
      completionParams.reasoning_format = "hidden";
    }

    const stream = await groq.chat.completions.create(completionParams);

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        io.to(channelId).emit("ai:chunk", { streamId, delta });
      }
    }

    const cleanText = fullText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    const aiMessage = await Message.create({
      channelId,
      senderId: aiBotUser._id,
      content: cleanText || "Sorry, I couldn't generate a response.",
      type: "ai",
    });

    const populated = await aiMessage.populate("senderId", "username avatarUrl status");
    await Channel.findByIdAndUpdate(channelId, { lastMessage: aiMessage._id });

    io.to(channelId).emit("ai:done", { streamId, message: populated });
  } catch (err) {
    console.error("AI request failed:", err.message);
    io.to(channelId).emit("ai:error", { streamId, message: "AI request failed" });
  }
};

const checkAutomationRules = async (channelId, senderId, trimmedContent) => {
  if (!trimmedContent || senderId.toString() === aiBotUser._id.toString()) return;

  const rules = await AutomationRule.find({ channelId });
  if (rules.length === 0) return;

  const lower = trimmedContent.toLowerCase();
  const match = rules.find((r) => lower.includes(r.keyword));
  if (!match) return;

  const botMessage = await Message.create({
    channelId,
    senderId: aiBotUser._id,
    content: match.response,
    type: "ai",
  });

  const populated = await botMessage.populate("senderId", "username avatarUrl status");
  await Channel.findByIdAndUpdate(channelId, { lastMessage: botMessage._id });
  io.to(channelId).emit("message:new", populated);
};

io.on("connection", async (socket) => {
  console.log(`User connected: ${socket.userId}`);

  await User.findByIdAndUpdate(socket.userId, { status: "online", lastSeen: new Date() });
  broadcastOnlineUsers();

  socket.on("room:join", (channelId) => {
    socket.join(channelId);
  });

  socket.on("room:leave", (channelId) => {
    socket.leave(channelId);
  });

  socket.on("message:send", async (data) => {
    try {
      if (isMessageRateLimited(socket.id)) {
        socket.emit("error", { message: "You're sending messages too fast. Please slow down." });
        return;
      }

      const { channelId, content, attachment } = data;
      if (!channelId || (!content?.trim() && !attachment?.url)) return;

      const trimmed = (content || "").trim().slice(0, 4000);

      const message = await Message.create({
        channelId,
        senderId: socket.userId,
        content: trimmed,
        type: attachment ? (attachment.resourceType === "image" ? "image" : "file") : "text",
        attachment: attachment || undefined,
      });

      const populated = await message.populate("senderId", "username avatarUrl status");
      await Channel.findByIdAndUpdate(channelId, { lastMessage: message._id });
      io.to(channelId).emit("message:new", populated);

      const aiMatch = trimmed.match(/^(?:@ai|\/ai)\s+([\s\S]+)/i);
      if (aiMatch && aiBotUser) {
        if (isAiOnCooldown(socket.userId)) {
          socket.emit("error", { message: "Please wait a few seconds before asking the AI again." });
          return;
        }

        let imageUrl = attachment?.resourceType === "image" ? attachment.url : null;

        if (!imageUrl) {
          const lastImageMsg = await Message.findOne({
            channelId,
            "attachment.resourceType": "image",
            deletedAt: null,
          }).sort({ createdAt: -1 });
          if (lastImageMsg) imageUrl = lastImageMsg.attachment.url;
        }

        handleAIRequest(channelId, aiMatch[1], imageUrl);
      } else if (aiBotUser) {
        checkAutomationRules(channelId, socket.userId, trimmed);
      }
    } catch (err) {
      console.error("message:send ERROR:", err.message);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing:start", ({ channelId, username }) => {
    socket.to(channelId).emit("typing:start", { userId: socket.userId, username });
  });

  socket.on("typing:stop", ({ channelId }) => {
    socket.to(channelId).emit("typing:stop", { userId: socket.userId });
  });

  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.userId}`);
    messageRateLimits.delete(socket.id);
    await User.findByIdAndUpdate(socket.userId, { status: "offline", lastSeen: new Date() });
    broadcastOnlineUsers();
  });
});

export { io };

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  aiBotUser = await ensureAIBotUser();
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();