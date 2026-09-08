import { get, post } from "./api";

export interface Inscription {
  id: number;
  personne_id: number;
  nom_utilisateur: string;
  email: string;
  est_actif: boolean;
  statut_inscription: 'en_attente' | 'approuve' | 'rejete';
  motif_rejet: string | null;
  date_inscription: string | null;
  created_at: string;
  personne?: {
    id: number;
    nom: string;
    prenom: string;
    sexe: string;
    date_naissance: string;
    lieu_naissance: string;
    nationalite: string;
    adresse: string;
    email: string;
    telephone: string;
    denomination_sociale: string;
    forme_juridique: string;
    identifiants?: { id: number; type_identifiant: string; valeur: string }[];
    activites?: { id: number; nom: string; secteur: string }[];
  };
  roles?: { id: number; nom: string }[];
}

export const inscriptionService = {
  list(params?: { statut?: string; per_page?: number; page?: number }): Promise<{ data: Inscription[]; current_page: number; last_page: number; total: number; per_page: number }> {
    return get('/inscriptions', params);
  },

  get(id: number): Promise<Inscription> {
    return get<Inscription>(`/inscriptions/${id}`);
  },

  approuver(id: number): Promise<void> {
    return post<void>(`/inscriptions/${id}/approuver`);
  },

  rejeter(id: number, motif: string): Promise<void> {
    return post<void>(`/inscriptions/${id}/rejeter`, { motif });
  },
};
