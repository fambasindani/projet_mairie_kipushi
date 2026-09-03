import { get, post, put, del } from "./api";
import type { Role, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
  };
}

export const roleService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Role>> {
    return get<PaginatedResponse<Role>>("/roles", qs(params));
  },

  get(id: number): Promise<Role> {
    return get<Role>(`/roles/${id}`);
  },

  create(data: { nom: string; description?: string; permissions?: number[] }): Promise<Role> {
    return post<Role>("/roles", data);
  },

  update(id: number, data: { nom?: string; description?: string; permissions?: number[] }): Promise<Role> {
    return put<Role>(`/roles/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/roles/${id}`);
  },

  assignPermissions(id: number, permissions: number[]): Promise<Role> {
    return post<Role>(`/roles/${id}/permissions`, { permissions });
  },
};
