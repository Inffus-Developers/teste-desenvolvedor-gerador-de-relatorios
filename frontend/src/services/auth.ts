import { apiFetch } from '@/services/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  token_type: string;
  user: UserSession;
}

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
} as const;

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    }

    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
  },

  getStoredUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
};