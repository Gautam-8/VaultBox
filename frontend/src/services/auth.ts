import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import Cookies from 'js-cookie';

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
    
    // Store in both localStorage and cookie
    localStorage.setItem(TOKEN_KEY, data.access_token);
    Cookies.set('auth-storage', data.access_token);
    
    // Update Zustand store
    const auth = useAuth.getState();
    auth.setUser(data.user);
    auth.setToken(data.access_token);
    
    return data;
  },

  async register(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", credentials);
    
    // Store in both localStorage and cookie
    localStorage.setItem(TOKEN_KEY, data.access_token);
    Cookies.set('auth-storage', data.access_token);
    
    // Update Zustand store
    const auth = useAuth.getState();
    auth.setUser(data.user);
    auth.setToken(data.access_token);
    
    return data;
  },

  async signOut(): Promise<void> {
    // Clear client-side storage
    localStorage.removeItem(TOKEN_KEY);
    Cookies.remove('auth-storage');
    
    // Clear Zustand store
    const auth = useAuth.getState();
    auth.setUser(null);
    auth.setToken(null);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
}; 