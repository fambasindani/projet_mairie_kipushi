import { get, post, put, del } from "./api";
import type { Quartier, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const quartierService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Quartier>> {
    return get<PaginatedResponse<Quartier>>("/quartiers", qs(params));
  },

  get(id: number): Promise<Quartier> {
    return get<Quartier>(`/quartiers/${id}`);
  },

  create(data: Partial<Quartier>): Promise<Quartier> {
    return post<Quartier>("/quartiers", data);
  },

  update(id: number, data: Partial<Quartier>): Promise<Quartier> {
    return put<Quartier>(`/quartiers/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/quartiers/${id}`);
  },

  parCommune(communeId: number): Promise<Quartier[]> {
    return get<Quartier[]>(`/quartiers/par-commune/${communeId}`);
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/quartiers/statistiques");
  },
};
