import { create } from "zustand";
import axiosClient from "../lib/axios";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: [],
  isLoadingChannels: true,
  isLoadingMessages: false,
  typingUsers: {},
  aiStreams: {},

  fetchChannels: async () => {
    set({ isLoadingChannels: true });
    try {
      const res = await axiosClient.get("/channels");
      set({ channels: res.data.channels, isLoadingChannels: false });
    } catch (err) {
      console.error("Failed to fetch channels:", err);
      set({ isLoadingChannels: false });
    }
  },

  createGroup: async (name, invites) => {
    const res = await axiosClient.post("/channels", { name, invites });
    set((state) => ({ channels: [res.data.channel, ...state.channels] }));
    return res.data.channel;
  },

  addMembers: async (channelId, invites) => {
    const res = await axiosClient.post(`/channels/${channelId}/invite`, { invites });
    const updated = res.data.channel;
    set((state) => ({
      channels: state.channels.map((c) => (c._id === updated._id ? updated : c)),
      activeChannel: state.activeChannel?._id === updated._id ? updated : state.activeChannel,
    }));
    return updated;
  },

  updateChannel: (updated) => {
    set((state) => ({
      channels: state.channels.map((c) => (c._id === updated._id ? updated : c)),
      activeChannel: state.activeChannel?._id === updated._id ? updated : state.activeChannel,
    }));
  },

  setActiveChannel: async (channel) => {
    const socket = useSocketStore.getState().socket;

    const prev = get().activeChannel;
    if (prev) socket?.emit("room:leave", prev._id);

    socket?.emit("room:join", channel._id);

    set({ activeChannel: channel, messages: [], isLoadingMessages: true });

    try {
      const res = await axiosClient.get(`/messages/${channel._id}`);
      set({ messages: res.data.messages, isLoadingMessages: false });
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  updateMessage: (updated) => {
    set((state) => ({
      messages: state.messages.map((m) => m._id === updated._id ? updated : m),
    }));
  },

  removeMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, deletedAt: new Date() } : m
      ),
    }));
  },

  setTyping: (userId, username) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: username },
    }));
  },

  clearTyping: (userId) => {
    set((state) => {
      const updated = { ...state.typingUsers };
      delete updated[userId];
      return { typingUsers: updated };
    });
  },

  startAIStream: (streamId) => {
    set((state) => ({ aiStreams: { ...state.aiStreams, [streamId]: "" } }));
  },

  appendAIChunk: (streamId, delta) => {
    set((state) => ({
      aiStreams: { ...state.aiStreams, [streamId]: (state.aiStreams[streamId] || "") + delta },
    }));
  },

  finishAIStream: (streamId, message) => {
    set((state) => {
      const streams = { ...state.aiStreams };
      delete streams[streamId];
      return { aiStreams: streams, messages: [...state.messages, message] };
    });
  },

  errorAIStream: (streamId) => {
    set((state) => {
      const streams = { ...state.aiStreams };
      delete streams[streamId];
      return { aiStreams: streams };
    });
  },
}));