import apiClient from "@/lib/apiClient";
import type { User, PaginatedResponse, PaginationParams } from "@/types";

/**
 * User service — CRUD operations for the /users endpoint.
 */
export const userService = {
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<PaginatedResponse<User>>("/users", { params });
    return data;
  },

  async getById(id: string): Promise<User> {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  async update(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await apiClient.patch<User>(`/users/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
