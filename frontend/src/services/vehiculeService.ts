import { get, post, put, patch, del } from "./api";
import type { Vehicule, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const vehiculeService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Vehicule>> {
    return get<PaginatedResponse<Vehicule>>("/vehicules", qs(params));
  },

  get(id: number): Promise<Vehicule> {
    return get<Vehicule>(`/vehicules/${id}`);
  },

  create(data: Partial<Vehicule>): Promise<Vehicule> {
    return post<Vehicule>("/vehicules", data);
  },

  update(id: number, data: Partial<Vehicule>): Promise<Vehicule> {
    return put<Vehicule>(`/vehicules/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/vehicules/${id}`);
  },

  types(): Promise<string[]> {
    return get<string[]>("/vehicules/types");
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/vehicules/statistiques");
  },

  toggleActivation(id: number): Promise<Vehicule> {
    return patch<Vehicule>(`/vehicules/${id}/toggle-activation`);
  },
};
