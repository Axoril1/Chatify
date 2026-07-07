import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import messageRoutes from "./routes/message.routes.js";
import User from "./models/User.js";
import Message from "./models/Message.js";
import Channel from "./models/Channel.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
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

io.on("connection", async (socket) => {
  console.log(`User connected: ${socket.userId}`);

  await User.findByIdAndUpdate(socket.userId, { status: "online", lastSeen: new Date() });
  broadcastOnlineUsers();

  socket.on("room:join", (channelId) => {
    socket.join(channelId);
    console.log(`User ${socket.userId} joined room ${channelId}`);
  });

  socket.on("room:leave", (channelId) => {
    socket.leave(channelId);
  });

  socket.on("message:send", async (data) => {
    try {
      const { channelId, content } = data;
      if (!channelId || !content?.trim()) return;

      const message = await Message.create({
        channelId,
        senderId: socket.userId,
        content: content.trim(),
      });

      const populated = await message.populate("senderId", "username avatarUrl status");
      await Channel.findByIdAndUpdate(channelId, { lastMessage: message._id });
      io.to(channelId).emit("message:new", populated);
    } catch (err) {
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
    await User.findByIdAndUpdate(socket.userId, { status: "offline", lastSeen: new Date() });
    broadcastOnlineUsers();
  });
});

export { io };

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));