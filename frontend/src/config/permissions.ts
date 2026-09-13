import type { Utilisateur } from '../types';

/**
 * Configuration centralisée des permissions d'accès par route.
 * Utilisée à la fois par la Sidebar (visibilité) et par PermissionRoute (accès réel).
 */
export const pathPermissionMap: Record<string, string> = {
  '/declarations': 'paiement:read',
  '/recus-perception': 'paiement:read',
  '/factures': 'facture:read',
  '/taxes': 'taxe:read',
  '/biens': 'operateur:read',
  '/vehicules': 'operateur:read',
  '/permis': 'permis:read',
  '/operateurs': 'operateur:read',
  '/activites': 'operateur:read',
  '/documents': 'document:read',
  '/identifiants': 'identifiant:read',
  '/utilisateurs': 'utilisateur:read',
  '/roles': 'role:read',
  '/permissions': 'permission:read',
  '/audit': 'audit:read',
  '/parametres': 'parametre:read',
  '/rapports': 'rapport:read',
  '/notifications': 'notification:read',
  '/provinces': 'operateur:read',
  '/villes': 'operateur:read',
  '/communes': 'operateur:read',
  '/quartiers': 'operateur:read',
};

export const operateurAllowedChildren: Record<string, string[]> = {
  operateurs: ['/operateurs'],
  fiscalite: ['/declarations', '/recus-perception', '/factures'],
};

export const operateurAllowedStandalone = ['/notifications', '/profil'];

/** Retourne le premier segment du chemin : /operateurs/12/modifier -> /operateurs */
export function basePath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length ? `/${segments[0]}` : '/';
}

export function getRequiredPermission(pathname: string): string | undefined {
  return pathPermissionMap[basePath(pathname)];
}

export function userPermissionSet(user?: Utilisateur | null): Set<string> {
  return new Set(
    user?.roles?.flatMap((r) => r.permissions?.map((p) => p.nom) ?? []) ?? []
  );
}

export function isAdminUser(user?: Utilisateur | null): boolean {
  return !!user?.roles?.some((r) => r.nom === 'Administrateur');
}

export function isOperateurUser(user?: Utilisateur | null): boolean {
  return !!user?.roles?.some((r) => r.nom === 'Operateur');
}
