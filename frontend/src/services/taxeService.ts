import { get, post, put, patch, del } from "./api";
import type { Taxe, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const taxeService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Taxe>> {
    return get<PaginatedResponse<Taxe>>("/taxes", qs(params));
  },

  get(id: number): Promise<Taxe> {
    return get<Taxe>(`/taxes/${id}`);
  },

  create(data: Partial<Taxe>): Promise<Taxe> {
    return post<Taxe>("/taxes", data);
  },

  update(id: number, data: Partial<Taxe>): Promise<Taxe> {
    return put<Taxe>(`/taxes/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/taxes/${id}`);
  },

  categories(): Promise<string[]> {
    return get<string[]>("/taxes/categories");
  },

  periodicites(): Promise<string[]> {
    return get<string[]>("/taxes/periodicites");
  },

  unites(): Promise<string[]> {
    return get<string[]>("/taxes/unites");
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/taxes/statistiques");
  },

  toggleActivation(id: number): Promise<Taxe> {
    return patch<Taxe>(`/taxes/${id}/toggle-activation`);
  },
};
