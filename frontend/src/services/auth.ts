import api from "@/lib/api";

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
  user: User;
  token: string;
}

const TOKEN_KEY = "auth_token";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  async register(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    await api.post("/auth/logout");
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
}; 