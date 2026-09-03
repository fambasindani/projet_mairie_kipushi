import { get, post, put, del } from "./api";
import type { Facture, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const factureService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Facture>> {
    return get<PaginatedResponse<Facture>>("/factures", qs(params));
  },

  get(id: number): Promise<Facture> {
    return get<Facture>(`/factures/${id}`);
  },

  create(data: Partial<Facture>): Promise<Facture> {
    return post<Facture>("/factures", data);
  },

  update(id: number, data: Partial<Facture>): Promise<Facture> {
    return put<Facture>(`/factures/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/factures/${id}`);
  },

  download(id: number): Promise<Blob> {
    return get<Blob>(`/factures/${id}/download`);
  },

  annuler(id: number): Promise<Facture> {
    return post<Facture>(`/factures/${id}/annuler`);
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/factures/statistiques");
  },
};
