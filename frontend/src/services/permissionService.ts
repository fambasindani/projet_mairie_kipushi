import { get, post, put, del } from "./api";
import type { Permission, PaginatedResponse, PaginationParams } from "../types";

interface PermListParams extends PaginationParams {
  ressource?: string;
}

function qs(params: PermListParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    ressource: params.ressource,
  };
}

export const permissionService = {
  list(params: PermListParams = {}): Promise<PaginatedResponse<Permission>> {
    return get<PaginatedResponse<Permission>>("/permissions", qs(params));
  },

  async all(): Promise<Permission[]> {
    const res = await get<{ data: Permission[] }>("/permissions", { per_page: 9999 });
    return res.data;
  },

  get(id: number): Promise<Permission> {
    return get<Permission>(`/permissions/${id}`);
  },

  create(data: { nom: string; ressource: string; action: string; description?: string }): Promise<Permission> {
    return post<Permission>("/permissions", data);
  },

  update(id: number, data: { nom?: string; ressource?: string; action?: string; description?: string }): Promise<Permission> {
    return put<Permission>(`/permissions/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/permissions/${id}`);
  },
};
