import { get, post, put, patch, del } from "./api";
import type { BienImmobilier, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const bienService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<BienImmobilier>> {
    return get<PaginatedResponse<BienImmobilier>>("/biens-immobiliers", qs(params));
  },

  get(id: number): Promise<BienImmobilier> {
    return get<BienImmobilier>(`/biens-immobiliers/${id}`);
  },

  create(data: Partial<BienImmobilier>): Promise<BienImmobilier> {
    return post<BienImmobilier>("/biens-immobiliers", data);
  },

  update(id: number, data: Partial<BienImmobilier>): Promise<BienImmobilier> {
    return put<BienImmobilier>(`/biens-immobiliers/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/biens-immobiliers/${id}`);
  },

  types(): Promise<string[]> {
    return get<string[]>("/biens-immobiliers/types");
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/biens-immobiliers/statistiques");
  },

  toggleActivation(id: number): Promise<BienImmobilier> {
    return patch<BienImmobilier>(`/biens-immobiliers/${id}/toggle-activation`);
  },
};
