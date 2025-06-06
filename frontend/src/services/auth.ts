import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export interface User {
  id: string;
  email: string;
  lastActive: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  confirmPassword?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

const TOKEN_KEY = "token";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", credentials);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    
    // Update Zustand store
    const auth = useAuth.getState();
    auth.setUser(data.user);
    auth.setToken(data.access_token);
    
    return data;
  },

  async register(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", credentials);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    
    // Update Zustand store
    const auth = useAuth.getState();
    auth.setUser(data.user);
    auth.setToken(data.access_token);
    
    return data;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    
    // Clear Zustand store
    const auth = useAuth.getState();
    auth.setUser(null);
    auth.setToken(null);
    
    await api.post("/auth/logout");
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
}; 