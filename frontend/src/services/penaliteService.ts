import { get, post } from "./api";

export interface PenaliteCalculation {
  jours_retard: number;
  majoration_retard: number;
  interet_retard: number;
  total_penalites: number;
  montant_total_avec_penalites: number;
}

export interface MiseEnDemeure {
  id: number;
  declaration_paiement_id: number;
  date_emission: string;
  date_echeance: string;
  montant_restant: number;
  motif: string;
  statut: 'en_cours' | 'honoree' | 'passee_en_force';
  created_at: string;
}

export const penaliteService = {
  calculer(declarationId: number): Promise<PenaliteCalculation> {
    return get<PenaliteCalculation>(`/penalites/${declarationId}/calculer`);
  },

  appliquer(declarationId: number): Promise<void> {
    return post<void>(`/penalites/${declarationId}/appliquer`);
  },

  envoyerMiseEnDemeure(declarationId: number, motif?: string): Promise<MiseEnDemeure> {
    return post<MiseEnDemeure>(`/penalites/${declarationId}/mise-en-demeure`, { motif });
  },

  mettreAJourToutes(): Promise<{ count: number }> {
    return post<{ count: number }>('/penalites/mettre-a-jour-toutes');
  },

  verifierMisesEnDemeure(): Promise<{ count: number }> {
    return post<{ count: number }>('/penalites/verifier-mises-en-demeure');
  },

  listerMisesEnDemeure(params?: { statut?: string; per_page?: number }): Promise<{ data: MiseEnDemeure[]; pagination: { current_page: number; last_page: number; total: number; per_page: number } }> {
    return get('/penalites/mises-en-demeure', params);
  },
};
