import { get, post, put, del } from "./api";
import type { Utilisateur, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const utilisateurService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Utilisateur>> {
    return get<PaginatedResponse<Utilisateur>>("/utilisateurs", qs(params));
  },

  get(id: number): Promise<Utilisateur> {
    return get<Utilisateur>(`/utilisateurs/${id}`);
  },

  create(data: Partial<Utilisateur> & { mot_de_passe?: string }): Promise<Utilisateur> {
    return post<Utilisateur>("/utilisateurs", data);
  },

  update(id: number, data: Partial<Utilisateur>): Promise<Utilisateur> {
    return put<Utilisateur>(`/utilisateurs/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/utilisateurs/${id}`);
  },
};
