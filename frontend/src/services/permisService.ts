import { get, post, put, patch, del } from "./api";
import type { PermisAutorisation, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const permisService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<PermisAutorisation>> {
    return get<PaginatedResponse<PermisAutorisation>>("/permis", qs(params));
  },

  get(id: number): Promise<PermisAutorisation> {
    return get<PermisAutorisation>(`/permis/${id}`);
  },

  create(data: Partial<PermisAutorisation>): Promise<PermisAutorisation> {
    return post<PermisAutorisation>("/permis", data);
  },

  update(id: number, data: Partial<PermisAutorisation>): Promise<PermisAutorisation> {
    return put<PermisAutorisation>(`/permis/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/permis/${id}`);
  },

  types(): Promise<string[]> {
    return get<string[]>("/permis/types");
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/permis/statistiques");
  },

  toggleValidation(id: number): Promise<PermisAutorisation> {
    return patch<PermisAutorisation>(`/permis/${id}/toggle-validation`);
  },
};
