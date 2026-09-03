import { get, post, put, del } from "./api";
import type { Ville, Commune, PaginatedResponse } from "../types";

export const villeService = {
  list(params: Record<string, string | number | boolean | undefined> = {}): Promise<PaginatedResponse<Ville>> {
    return get<PaginatedResponse<Ville>>("/villes", params);
  },

  get(id: number): Promise<Ville> {
    return get<Ville>(`/villes/${id}`);
  },

  create(data: Partial<Ville>): Promise<Ville> {
    return post<Ville>("/villes", data);
  },

  update(id: number, data: Partial<Ville>): Promise<Ville> {
    return put<Ville>(`/villes/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/villes/${id}`);
  },

  communes(id: number): Promise<Commune[]> {
    return get<Commune[]>(`/villes/${id}/communes`);
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/villes/statistiques");
  },
};
