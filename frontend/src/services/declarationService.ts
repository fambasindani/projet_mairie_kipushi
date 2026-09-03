import { get, post, put, del } from "./api";
import type { DeclarationPaiement, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const declarationService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<DeclarationPaiement>> {
    return get<PaginatedResponse<DeclarationPaiement>>("/declarations", qs(params));
  },

  get(id: number): Promise<DeclarationPaiement> {
    return get<DeclarationPaiement>(`/declarations/${id}`);
  },

  create(data: Partial<DeclarationPaiement>): Promise<DeclarationPaiement> {
    return post<DeclarationPaiement>("/declarations", data);
  },

  update(id: number, data: Partial<DeclarationPaiement>): Promise<DeclarationPaiement> {
    return put<DeclarationPaiement>(`/declarations/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/declarations/${id}`);
  },

  valider(id: number): Promise<DeclarationPaiement> {
    return post<DeclarationPaiement>(`/declarations/${id}/valider`, {});
  },

  annuler(id: number): Promise<DeclarationPaiement> {
    return post<DeclarationPaiement>(`/declarations/${id}/annuler`, {});
  },

  exonerer(id: number, motif?: string): Promise<DeclarationPaiement> {
    return post<DeclarationPaiement>(`/declarations/${id}/exonerer`, { motif: motif || '' });
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/declarations/statistiques");
  },
};
