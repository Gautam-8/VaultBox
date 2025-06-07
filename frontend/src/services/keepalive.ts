import api from "@/lib/api";

export const keepAliveService = {
  async ping(): Promise<string> {
    try {
      const { data } = await api.get<string>("/");
      console.log(`🏓 Server keep-alive successful: ${data}`);
      return data;
    } catch (error) {
      console.warn("🔴 Server keep-alive failed:", error);
      throw error;
    }
  },
}; 