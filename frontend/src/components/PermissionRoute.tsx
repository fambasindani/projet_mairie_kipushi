import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  basePath,
  getRequiredPermission,
  isAdminUser,
  isOperateurUser,
  operateurAllowedChildren,
  userPermissionSet,
} from '../config/permissions';

/**
 * Vérifie que l'utilisateur connecté a le droit d'accéder à la route courante.
 * Une route sans permission déclarée est accessible à tout utilisateur connecté.
 */
export default function PermissionRoute() {
  const { user } = useAuth();
  const location = useLocation();
  const base = basePath(location.pathname);

  // Le profil est toujours accessible
  if (base === '/profil') return <Outlet />;

  // L'administrateur a tous les droits
  if (isAdminUser(user)) return <Outlet />;

  // L'opérateur n'a accès qu'à un sous-ensemble
  if (isOperateurUser(user)) {
    const allowed = [
      ...Object.values(operateurAllowedChildren).flat(),
      '/notifications',
      '/profil',
    ].includes(base);
    return allowed ? <Outlet /> : <Navigate to="/profil" replace />;
  }

  // Autres rôles : contrôle par permission
  const required = getRequiredPermission(location.pathname);
  if (!required) return <Outlet />;

  return userPermissionSet(user).has(required) ? (
    <Outlet />
  ) : (
    <Navigate to="/profil" replace />
  );
}
