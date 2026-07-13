import { create } from "zustand";
import axiosClient from "../lib/axios";

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  checkAuth: async () => {
    try {
      const res = await axiosClient.get("/auth/me");
      set({ user: res.data.user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  signup: async (username, email, password) => {
    const res = await axiosClient.post("/auth/signup", { username, email, password});
    set({ user: res.data.user });
  },

  login: async (email, password) => {
    const res = await axiosClient.post("/auth/login", { email, password });
    set({ user: res.data.user });
  },

  logout: async () => {
    await axiosClient.post("/auth/logout");
    set({ user: null });
  },

  updateProfile: async (updates) => {
    const res = await axiosClient.patch("/auth/me", updates);
    set({ user: res.data.user });
    return res.data.user;
  },

  changePassword: async (currentPassword, newPassword) => {
    await axiosClient.patch("/auth/me/password", { currentPassword, newPassword });
  },
}));