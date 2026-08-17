import apiClient from "@/lib/apiClient";
import { STORAGE_KEYS } from "@/lib/constants";
import type { LoginRequest, RegisterRequest, AuthResponse, User } from "@/types/auth";

/**
 * Auth service — wraps all authentication-related API calls.
 */
export const authService = {
  /**
   * Log in with email and password.
   * Stores the access token in localStorage on success.
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", credentials);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    }
    return data;
  },

  /**
   * Register a new user account.
   */
  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    }
    return data;
  },

  /**
   * Log out the current user and clear stored tokens.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
  },

  /**
   * Fetch the currently authenticated user's profile.
   */
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },
};
