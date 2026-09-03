import { get, post, put, del } from "./api";
import type { Province, Commune, PaginatedResponse } from "../types";

export const provinceService = {
  list(params: Record<string, string | number | boolean | undefined> = {}): Promise<PaginatedResponse<Province>> {
    return get<PaginatedResponse<Province>>("/provinces", params);
  },

  get(id: number): Promise<Province> {
    return get<Province>(`/provinces/${id}`);
  },

  create(data: Partial<Province>): Promise<Province> {
    return post<Province>("/provinces", data);
  },

  update(id: number, data: Partial<Province>): Promise<Province> {
    return put<Province>(`/provinces/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/provinces/${id}`);
  },

  communes(id: number): Promise<Commune[]> {
    return get<Commune[]>(`/provinces/${id}/communes`);
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/provinces/statistiques");
  },
};
