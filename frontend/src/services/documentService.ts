import { get, post, del } from './api';
import type { Document as DocType } from '../types';

export const documentService = {
  list(params?: Record<string, string | number | boolean | undefined>): Promise<DocType[]> {
    return get<DocType[]>('/documents', params);
  },

  get(id: number): Promise<DocType> {
    return get<DocType>(`/documents/${id}`);
  },

  byPersonne(personneId: number): Promise<DocType[]> {
    return get<DocType[]>('/documents', { personne_id: personneId });
  },

  upload(personneId: number, file: File, typeDocument: string, numero?: string): Promise<DocType> {
    const formData = new FormData();
    formData.append('personne_id', String(personneId));
    formData.append('type_document', typeDocument);
    formData.append('fichier', file);
    if (numero) formData.append('numero', numero);
    return post<DocType>('/documents', formData);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/documents/${id}`);
  },

  downloadUrl(id: number): string {
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
    return `${base}/documents/${id}/download`;
  },

  types(): Promise<Record<string, string>> {
    return get<Record<string, string>>('/documents/types');
  },
};
