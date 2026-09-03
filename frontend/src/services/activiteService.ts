import { get, post, put, patch, del } from "./api";
import type { ActiviteEconomique, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const activiteService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<ActiviteEconomique>> {
    return get<PaginatedResponse<ActiviteEconomique>>("/activites-economiques", qs(params));
  },

  get(id: number): Promise<ActiviteEconomique> {
    return get<ActiviteEconomique>(`/activites-economiques/${id}`);
  },

  create(data: Partial<ActiviteEconomique>): Promise<ActiviteEconomique> {
    return post<ActiviteEconomique>("/activites-economiques", data);
  },

  update(id: number, data: Partial<ActiviteEconomique>): Promise<ActiviteEconomique> {
    return put<ActiviteEconomique>(`/activites-economiques/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/activites-economiques/${id}`);
  },

  secteurs(): Promise<string[]> {
    return get<string[]>("/activites-economiques/secteurs");
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/activites-economiques/statistiques");
  },
};
