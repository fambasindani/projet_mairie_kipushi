import { get, post, put, del } from "./api";

export type TypePerception = 'peage_urbain' | 'pont_bascule' | 'etalage' | 'chargement' | 'dechargement' | 'autre';

export const typePerceptionLabels: Record<TypePerception, string> = {
  peage_urbain: 'Péage urbain',
  pont_bascule: 'Pont bascule',
  etalage: 'Étalage',
  chargement: 'Chargement',
  dechargement: 'Déchargement',
  autre: 'Autre',
};

export const typePerceptionPrefix: Record<TypePerception, string> = {
  peage_urbain: 'PEA',
  pont_bascule: 'PON',
  etalage: 'ETA',
  chargement: 'CHA',
  dechargement: 'DEC',
  autre: 'AUT',
};

export interface RecuPerception {
  id: number;
  taxe_id: number;
  personne_id: number | null;
  percepteur_id: number | null;
  type_perception: string;
  numero: string;
  date_emission: string;
  heure_emission: string | null;
  categorie_vehicule: string | null;
  plaque_immatriculation: string | null;
  montant: number;
  trajet: 'aller' | 'retour' | 'aller_retour' | null;
  chauffeur_nom: string | null;
  conducteur_nom: string | null;
  Numero_Piece: string | null;
  designation: string | null;
  poids: number | null;
  observations: string | null;
  taxe?: { id: number; nom: string; code: string };
  personne?: { id: number; nom: string; prenom: string; nom_complet: string };
  percepteur?: { id: number; nom: string; prenom: string };
  created_at: string;
}

export interface RecuPerceptionCreate {
  taxe_id: number;
  personne_id?: number;
  type_perception: string;
  date_emission: string;
  heure_emission?: string;
  categorie_vehicule?: string;
  plaque_immatriculation?: string;
  montant: number;
  trajet?: 'aller' | 'retour' | 'aller_retour';
  chauffeur_nom?: string;
  conducteur_nom?: string;
  Numero_Piece?: string;
  designation?: string;
  poids?: number;
  observations?: string;
}

export interface PaginatedRecus {
  data: RecuPerception[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export const recuPerceptionService = {
  list(params?: { page?: number; per_page?: number; type_perception?: string; date_debut?: string; date_fin?: string; taxe_id?: number; search?: string }): Promise<PaginatedRecus> {
    return get<PaginatedRecus>('/recus-perception', params as Record<string, string | number | boolean | undefined>);
  },

  get(id: number): Promise<RecuPerception> {
    return get<RecuPerception>(`/recus-perception/${id}`);
  },

  create(data: RecuPerceptionCreate): Promise<RecuPerception> {
    return post<RecuPerception>('/recus-perception', data);
  },

  update(id: number, data: Partial<RecuPerceptionCreate>): Promise<RecuPerception> {
    return put<RecuPerception>(`/recus-perception/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/recus-perception/${id}`);
  },

  prochainNumero(typePerception?: string): Promise<{ numero: string }> {
    return get<{ numero: string }>('/recus-perception/prochain-numero', { type_perception: typePerception } as Record<string, string>);
  },

  stats(params?: { type_perception?: string; date_debut?: string; date_fin?: string }): Promise<{ total_recus: number; montant_total: number; par_type: Array<{ type_perception: string; total: number; montant: number }> }> {
    return get('/recus-perception/stats', params as Record<string, string | number | boolean | undefined>);
  },

  types(): Promise<Record<string, string>> {
    return get<Record<string, string>>('/recus-perception/types');
  },

  qrcode(id: number): Promise<{ numero: string; url: string }> {
    return get<{ numero: string; url: string }>(`/recus-perception/${id}/qrcode`);
  },
};
