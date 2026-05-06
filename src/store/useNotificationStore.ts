import { create } from "zustand";
import axiosInstance from "../api/axiosInstance";

export interface Notification {
  _id: string;
  type: "MESSAGE" | "ANNOUNCEMENT";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toggleDropdown: () => void;
  closeDropdown: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isOpen: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/notifications");
      // Assuming response.data is an array of notifications
      const notifications = response.data;
      const unreadCount = notifications.filter(
        (n: Notification) => !n.read
      ).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      // Optimistic update
      const { notifications } = get();
      const updatedNotifications = notifications.map((n) =>
        n._id === id ? { ...n, read: true } : n
      );
      const unreadCount = updatedNotifications.filter((n) => !n.read).length;
      set({ notifications: updatedNotifications, unreadCount });

      await axiosInstance.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert if needed, but for now just log
    }
  },

  markAllAsRead: async () => {
    try {
      // Optimistic update
      const { notifications } = get();
      const updatedNotifications = notifications.map((n) => ({
        ...n,
        read: true,
      }));
      set({ notifications: updatedNotifications, unreadCount: 0 });

      await axiosInstance.patch("/notifications/mark-all-read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  },

  toggleDropdown: () => set((state) => ({ isOpen: !state.isOpen })),
  closeDropdown: () => set({ isOpen: false }),
}));
