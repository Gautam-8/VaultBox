import api from "@/lib/api";

export interface Notification {
  id: string;
  type: "ACCESS_REQUEST" | "INACTIVITY_WARNING";
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export const notificationService = {
  async getUserNotifications(): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>("/notifications");
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put("/notifications/mark-all-read");
  },
}; 