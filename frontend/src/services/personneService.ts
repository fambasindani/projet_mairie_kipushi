import { get, post, put, patch, del } from "./api";
import type { Personne, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const personneService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Personne>> {
    return get<PaginatedResponse<Personne>>("/personnes", qs(params));
  },

  get(id: number): Promise<Personne> {
    return get<Personne>(`/personnes/${id}`);
  },

  create(data: Partial<Personne>): Promise<Personne> {
    return post<Personne>("/personnes", data);
  },

  update(id: number, data: Partial<Personne>): Promise<Personne> {
    return put<Personne>(`/personnes/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/personnes/${id}`);
  },

  toggleActivation(id: number): Promise<Personne> {
    return patch<Personne>(`/personnes/${id}/toggle-activation`);
  },

  formaliser(id: number): Promise<Personne> {
    return patch<Personne>(`/personnes/${id}/formaliser`);
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/personnes/statistiques");
  },
};
