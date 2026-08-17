/**
 * Application-wide constants.
 * Import from this file rather than hard-coding strings throughout the codebase.
 */

export const APP_NAME = "My App";
export const APP_VERSION = "1.0.0";

/** API base URL – falls back to localhost for local development */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/** LocalStorage keys */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
} as const;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;

/** Route paths */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  DASHBOARD_USERS: "/dashboard/users",
  DASHBOARD_REPORTS: "/dashboard/reports",
  DASHBOARD_SETTINGS: "/dashboard/settings",
} as const;
