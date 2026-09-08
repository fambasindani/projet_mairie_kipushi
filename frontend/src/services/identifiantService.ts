import { get, post, put, del } from "./api";
import type { IdentifiantOfficiel, PaginatedResponse, PaginationParams } from "../types";

interface IdentifiantListParams extends PaginationParams {
  personne_id?: number;
  type_identifiant?: string;
}

function qs(params: IdentifiantListParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    personne_id: params.personne_id,
    type_identifiant: params.type_identifiant,
  };
}

export const identifiantService = {
  list(params: IdentifiantListParams = {}): Promise<PaginatedResponse<IdentifiantOfficiel>> {
    return get<PaginatedResponse<IdentifiantOfficiel>>("/identifiants", qs(params));
  },

  get(id: number): Promise<IdentifiantOfficiel> {
    return get<IdentifiantOfficiel>(`/identifiants/${id}`);
  },

  create(data: Partial<IdentifiantOfficiel>): Promise<IdentifiantOfficiel> {
    return post<IdentifiantOfficiel>("/identifiants", data);
  },

  update(id: number, data: Partial<IdentifiantOfficiel>): Promise<IdentifiantOfficiel> {
    return put<IdentifiantOfficiel>(`/identifiants/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/identifiants/${id}`);
  },

  types(): Promise<Record<string, string>> {
    return get<Record<string, string>>("/identifiants/types");
  },
};
