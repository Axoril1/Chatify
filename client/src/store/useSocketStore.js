import { create } from "zustand";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";

const SOCKET_URL = "http://localhost:5000";

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: [],

  connect: () => {
    if (get().socket?.connected) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      set({ isConnected: true });

      // Re-join active channel on reconnect
      const activeChannel = useChatStore.getState().activeChannel;
      if (activeChannel) {
        socket.emit("room:join", activeChannel._id);
        console.log("Re-joined room:", activeChannel._id);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      set({ isConnected: false });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("users:online", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Set socket in state immediately
    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false, onlineUsers: [] });
  },
}));