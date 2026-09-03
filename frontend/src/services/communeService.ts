import { get, post, put, del } from "./api";
import type { Commune, Quartier, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const communeService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Commune>> {
    return get<PaginatedResponse<Commune>>("/communes", qs(params));
  },

  listAll(params: Record<string, string | number | boolean | undefined> = {}): Promise<PaginatedResponse<Commune>> {
    return get<PaginatedResponse<Commune>>("/communes", params);
  },

  get(id: number): Promise<Commune> {
    return get<Commune>(`/communes/${id}`);
  },

  create(data: Partial<Commune>): Promise<Commune> {
    return post<Commune>("/communes", data);
  },

  update(id: number, data: Partial<Commune>): Promise<Commune> {
    return put<Commune>(`/communes/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/communes/${id}`);
  },

  quartiers(id: number): Promise<Quartier[]> {
    return get<Quartier[]>(`/communes/${id}/quartiers`);
  },

  async parVille(villeId: number): Promise<Commune[]> {
    const res = await get<{ data: Commune[] }>("/communes", { id_ville: villeId, per_page: 100, est_actif: true });
    return res.data;
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/communes/statistiques");
  },
};
