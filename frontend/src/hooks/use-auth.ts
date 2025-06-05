import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService, User } from "@/services/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user: User | null) => set({ user }),
      setToken: (token: string | null) => set({ token }),
      signOut: async () => {
        await authService.signOut();
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage",
    }
  )
); 