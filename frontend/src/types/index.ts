// ─── Auth ───
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  utilisateur: Utilisateur;
}

export interface Utilisateur {
  id: number;
  personne_id: number | null;
  nom_utilisateur: string;
  email: string;
  est_actif: boolean;
  est_verrouille: boolean;
  tentatives_connexion: number;
  derniere_connexion: string | null;
  date_expiration_mot_de_passe: string | null;
  created_at: string;
  updated_at: string;
  personne?: Personne;
  roles?: Role[];
}

// ─── Role & Permission ───
export interface Role {
  id: number;
  nom: string;
  description: string | null;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  nom: string;
  ressource: string;
  action: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Personne (Opérateur) ───
export interface Personne {
  id: number;
  type: "physique" | "morale";
  nom: string;
  prenom: string | null;
  nom_complet?: string;
  date_naissance: string | null;
  lieu_naissance: string | null;
  nationalite: string | null;
  sexe: "M" | "F" | null;
  cni_numero: string | null;
  denomination_sociale: string | null;
  forme_juridique: string | null;
  date_creation: string | null;
  adresse: string | null;
  quartier: string | null;
  commune: string | null;
  ville: string | null;
  province: string | null;
  telephone: string | null;
  telephone_2: string | null;
  email: string | null;
  site_web: string | null;
  est_actif: boolean;
  est_formalise: boolean;
  date_formalisation: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar: string | null;
  avatar_url?: string | null;
  id_quartier: number | null;
  id_province: number | null;
  id_ville: number | null;
  activites?: ActiviteEconomique[];
  utilisateur?: { id: number; personne_id: number; email: string };
  created_at: string;
  updated_at: string;
}

// ─── Activité Economique ───
export interface ActiviteEconomique {
  id: number;
  code: string;
  nom: string;
  secteur: string | null;
  description: string | null;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Taxe ───
export interface Taxe {
  id: number;
  code: string;
  nom: string;
  categorie:
    | "patente"
    | "foncier"
    | "revenus_locatifs"
    | "personnel_minimum"
    | "vehicule"
    | "permis_construire"
    | "etalage"
    | "autre";
  description: string | null;
  taux: number | null;
  unite: "pourcentage" | "montant_fixe" | "par_unite";
  periodicite:
    | "mensuelle"
    | "trimestrielle"
    | "semestrielle"
    | "annuelle"
    | "evenementielle";
  bareme: Record<string, unknown> | null;
  est_actif: boolean;
  est_locale: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Déclaration Paiement ───
export interface DeclarationPaiement {
  id: number;
  personne_id: number;
  taxe_id: number;
  bien_immobilier_id: number | null;
  vehicule_id: number | null;
  permis_id: number | null;
  exercice: number;
  periode_debut: string;
  periode_fin: string;
  montant_base: number;
  montant_taxe: number;
  penalites: number;
  montant_total: number;
  date_limite_paiement: string;
  date_paiement: string | null;
  statut:
    | "en_attente"
    | "paye"
    | "en_retard"
    | "conteste"
    | "annule"
    | "exonere";
  reference_paiement: string | null;
  justificatif: string | null;
  observations: string | null;
  personne?: Personne;
  taxe?: Taxe;
  created_at: string;
  updated_at: string;
}

// ─── Facture ───
export interface Facture {
  id: number;
  declaration_paiement_id: number;
  numero_facture: string;
  date_emission: string;
  montant_ht: number;
  montant_tva: number;
  montant_total: number;
  devise: "CDF" | "USD";
  chemin_pdf: string | null;
  statut: "emise" | "payee" | "annulee";
  observations: string | null;
  declaration_paiement?: {
    id: number;
    personne?: Personne;
    taxe?: Taxe;
  };
  created_at: string;
  updated_at: string;
}

// ─── Bien Immobilier ───
export interface BienImmobilier {
  id: number;
  proprietaire_id: number;
  adresse: string | null;
  quartier: string | null;
  commune: string | null;
  id_quartier: number | null;
  parcelle_id: string | null;
  type_bien:
    | "terrain"
    | "maison"
    | "appartement"
    | "immeuble"
    | "local_commercial"
    | "entrepot"
    | "autre";
  superficie: number | null;
  valeur_locative: number | null;
  valeur_venale: number | null;
  classement: number | null;
  est_actif: boolean;
  proprietaire?: Personne;
  quartier_ref?: Quartier;
  created_at: string;
  updated_at: string;
}

// ─── Véhicule ───
export interface Vehicule {
  id: number;
  proprietaire_id: number;
  plaque_immatriculation: string;
  marque: string | null;
  modele: string | null;
  annee_fabrication: number | null;
  couleur: string | null;
  type_vehicule:
    | "voiture"
    | "moto"
    | "poids_lourd"
    | "bus"
    | "minibus"
    | "taxi"
    | "autre";
  nombre_places: number | null;
  poids: number | null;
  est_actif: boolean;
  proprietaire?: Personne;
  created_at: string;
  updated_at: string;
}

// ─── Permis / Autorisation ───
export interface PermisAutorisation {
  id: number;
  personne_id: number;
  type_permis:
    | "patente"
    | "construire"
    | "occupation_sol"
    | "etalage"
    | "exploitation"
    | "transport"
    | "autre";
  numero: string;
  date_delivrance: string;
  date_expiration: string;
  est_valide: boolean;
  est_renouvele: boolean;
  document_scan: string | null;
  personne?: Personne;
  created_at: string;
  updated_at: string;
}

// ─── Province ───
export interface Province {
  id: number;
  nom: string;
  code: string;
  est_actif: boolean;
  villes?: Ville[];
  created_at: string;
  updated_at: string;
}

// ─── Ville ───
export interface Ville {
  id: number;
  nom: string;
  code: string;
  id_province: number | null;
  province?: Province;
  est_actif: boolean;
  communes?: Commune[];
  created_at: string;
  updated_at: string;
}

// ─── Commune ───
export interface Commune {
  id: number;
  nom: string;
  code: string;
  id_ville: number | null;
  ville?: Ville;
  est_actif: boolean;
  quartiers?: Quartier[];
  created_at: string;
  updated_at: string;
}

// ─── Quartier ───
export interface Quartier {
  id: number;
  commune_id: number;
  nom: string;
  code: string;
  est_actif: boolean;
  commune?: Commune;
  created_at: string;
  updated_at: string;
}

// ─── Notification ───
export interface Notification {
  id: number;
  personne_id: number | null;
  type_notification:
    | "paiement_echu"
    | "renouvellement_permis"
    | "controle_prochain"
    | "information";
  sujet: string;
  message: string;
  est_lue: boolean;
  date_envoi: string;
  date_lecture: string | null;
  lien_action: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Identifiant Officiel ───
export interface IdentifiantOfficiel {
  id: number;
  personne_id: number;
  type_identifiant:
    | "RCCM"
    | "IDNAT"
    | "NUMERO_IMPOT"
    | "NIF"
    | "CNSS"
    | "ONEM"
    | "PASSEPORT"
    | "PERMIS_CONDURE";
  valeur: string;
  province_delivrance: string | null;
  date_delivrance: string | null;
  date_expiration: string | null;
  est_actif: boolean;
  personne?: Personne;
  created_at: string;
  updated_at: string;
}

// ─── Document ───
export interface Document {
  id: number;
  personne_id: number;
  type_document:
    | "CNI"
    | "PASSEPORT"
    | "STATUTS"
    | "RCCM"
    | "PATENTE"
    | "QUITTANCE"
    | "AVATAR"
    | "AUTRE";
  numero: string | null;
  fichier: string;
  date_expiration: string | null;
  est_valide: boolean;
  personne?: Personne;
  created_at: string;
  updated_at: string;
}

// ─── Parametre ───
export interface Parametre {
  id: number;
  cle: string;
  valeur: string;
  description: string | null;
  est_modifiable: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Log Audit ───
export interface LogAudit {
  id: number;
  utilisateur_id: number | null;
  action: string;
  table_cible: string;
  enregistrement_id: number | null;
  anciennes_valeurs: Record<string, unknown> | null;
  nouvelles_valeurs: Record<string, unknown> | null;
  adresse_ip: string | null;
  user_agent: string | null;
  utilisateur?: Utilisateur;
  created_at: string;
  updated_at: string;
}

// ─── Dashboard ───
export interface DashboardGlobal {
  operateurs?: { total?: number; actifs?: number; formalises?: number; nouveaux_mois?: number };
  finances?: { total_collecte?: number; en_attente?: number; en_retard?: number; nb_factures?: number; penalites?: number };
  taxes?: { total?: number; actives?: number; categories?: { categorie: string; total: number }[] };
  utilisateurs?: { total?: number; actifs?: number; par_role?: { nom: string; total: number }[] };
  evolution?: { dernier_mois?: number; mois_precedent?: number };
}

export interface DashboardFinances {
  periode: { debut: string; fin: string };
  collecte: { total: number; en_attente: number; en_retard: number; penalites: number };
  par_mois: { mois: string; montant: number; total: number }[];
  par_taxe: { taxe_id: number; montant: number; total: number; taxe?: Taxe }[];
  recouvrement: { taux: number; objectif: number };
  factures: { total: number; montant_total: number; montant_moyen: number };
}

// ─── Pagination ───
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

// ─── API Error ───
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
