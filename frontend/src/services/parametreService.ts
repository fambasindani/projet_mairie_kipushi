import { get, post, put, del } from "./api";
import type { Parametre, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const parametreService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Parametre>> {
    return get<PaginatedResponse<Parametre>>("/parametres", qs(params));
  },

  get(id: number): Promise<Parametre> {
    return get<Parametre>(`/parametres/${id}`);
  },

  create(data: Partial<Parametre>): Promise<Parametre> {
    return post<Parametre>("/parametres", data);
  },

  update(id: number, data: Partial<Parametre>): Promise<Parametre> {
    return put<Parametre>(`/parametres/${id}`, data);
  },

  updateByCle(cle: string, data: Partial<Parametre>): Promise<Parametre> {
    return put<Parametre>(`/parametres/${cle}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/parametres/${id}`);
  },
};
