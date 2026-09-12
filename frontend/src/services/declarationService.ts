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

  annuler(id: number, motif_annulation: string): Promise<DeclarationPaiement> {
    return post<DeclarationPaiement>(`/declarations/${id}/annuler`, { motif_annulation });
  },

  exonerer(id: number, motif: string, justificatif: File): Promise<DeclarationPaiement> {
    const formData = new FormData();
    formData.append('motif', motif);
    formData.append('justificatif', justificatif);
    return post<DeclarationPaiement>(`/declarations/${id}/exonerer`, formData);
  },

  justificatifExonerationUrl(id: number): string {
    const BASE_URL = import.meta.env.VITE_API_URL || '/api';
    return `${BASE_URL}/declarations/${id}/justificatif-exoneration`;
  },

  async downloadJustificatifExoneration(id: number): Promise<void> {
    const url = this.justificatifExonerationUrl(id);
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erreur lors du téléchargement');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/declarations/statistiques");
  },
};
