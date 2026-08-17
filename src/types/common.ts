// ─── Generic API response wrappers ───────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Common utility types ─────────────────────────────────────────────────────

export type ID = string;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

/** Make selected keys of T required */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Make selected keys of T optional */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
