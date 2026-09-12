import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  Receipt,
  Building,
  MapPin,
  Bell,
  ChevronRight,
  X,
  Grid3X3,
  Globe,
  Landmark,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SubItem {
  label: string;
  path: string;
}

interface NavGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  children: SubItem[];
  standalone?: boolean;
  path?: string;
}

const navGroups: NavGroup[] = [
  {
    key: "dashboard",
    label: "Tableau de bord",
    icon: <LayoutDashboard size={20} />,
    children: [{ label: "Tableau de bord", path: "/dashboard" }],
    standalone: true,
    path: "/dashboard",
  },
  {
    key: "operateurs",
    label: "Opérateurs",
    icon: <Users size={20} />,
    children: [
      { label: "Opérateurs", path: "/operateurs" },
      { label: "Activités économiques", path: "/activites" },
      { label: "Documents", path: "/documents" },
      { label: "Identifiants officiels", path: "/identifiants" },
    ],
  },
  {
    key: "admin",
    label: "Administration",
    icon: <Settings size={20} />,
    children: [
      { label: "Utilisateurs", path: "/utilisateurs" },
      { label: "Inscriptions", path: "/inscriptions" },
      { label: "Rôles", path: "/roles" },
      { label: "Permissions", path: "/permissions" },
      { label: "Audit", path: "/audit" },
      { label: "Paramètres", path: "/parametres" },
      { label: "Rapports", path: "/rapports" },
    ],
  },
  {
    key: "fiscalite",
    label: "Fiscalité",
    icon: <Receipt size={20} />,
    children: [
      { label: "Taxes", path: "/taxes" },
      { label: "Déclarations", path: "/declarations" },
      { label: "Reçus perception", path: "/recus-perception" },
    ],
  },
  {
    key: "patrimoine",
    label: "Patrimoine",
    icon: <Building size={20} />,
    children: [
      { label: "Biens immobiliers", path: "/biens" },
      { label: "Véhicules", path: "/vehicules" },
      { label: "Permis", path: "/permis" },
    ],
  },
  {
    key: "geographie",
    label: "Géographie",
    icon: <Globe size={20} />,
    children: [
      { label: "Provinces", path: "/provinces" },
      { label: "Villes", path: "/villes" },
      { label: "Communes", path: "/communes" },
      { label: "Quartiers", path: "/quartiers" },
    ],
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: <Bell size={20} />,
    children: [{ label: "Notifications", path: "/notifications" }],
    standalone: true,
    path: "/notifications",
  },
  {
    key: "profil",
    label: "Profil",
    icon: <UserCircle size={20} />,
    children: [{ label: "Mon profil", path: "/profil" }],
    standalone: true,
    path: "/profil",
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function getOpenGroup(pathname: string): string {
  for (const group of navGroups) {
    if (group.standalone && group.path) {
      if (
        group.path === "/"
          ? pathname === "/"
          : pathname.startsWith(group.path)
      ) {
        return group.key;
      }
    }
    for (const child of group.children) {
      if (child.path === "/" ? pathname === "/" : pathname.startsWith(child.path)) {
        return group.key;
      }
    }
  }
  return "dashboard";
}

const SYSTEM_ROLES = ['Administrateur', 'Operateur'];

const pathPermissionMap: Record<string, string> = {
  '/declarations': 'paiement:read',
  '/recus-perception': 'paiement:read',
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

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const isOpen = !collapsed;

  const isAdmin = user?.roles?.some((r) => r.nom === "Administrateur");
  const isOperateur = user?.roles?.some((r) => r.nom === "Operateur");
  const userPermissions = new Set(
    user?.roles?.flatMap((r) => r.permissions?.map((p) => p.nom) ?? []) ?? []
  );

  const hasPermission = (path: string) => {
    if (isAdmin) return true;
    const required = pathPermissionMap[path];
    return !required || userPermissions.has(required);
  };

  const operateurAllowedChildren: Record<string, string[]> = {
    operateurs: ['/operateurs'],
    fiscalite: ['/declarations', '/recus-perception'],
  };

  const operateurAllowedStandalone = ['/notifications', '/profil'];

  const isGroupVisible = (g: NavGroup) => {
    if (isAdmin) return true;
    if (isOperateur) {
      if (g.standalone) return operateurAllowedStandalone.includes(g.path!);
      return g.key in operateurAllowedChildren;
    }
    return true;
  };

  const isChildVisible = (groupKey: string, childPath: string) => {
    if (isAdmin) return true;
    if (isOperateur) {
      const allowed = operateurAllowedChildren[groupKey];
      return allowed ? allowed.includes(childPath) : false;
    }
    return hasPermission(childPath);
  };

  const visibleGroups = navGroups
    .filter(isGroupVisible)
    .map((g) => ({
      ...g,
      children: g.children.filter((c) => isChildVisible(g.key, c.path)),
    }))
    .filter((g) => g.standalone || g.children.length > 0);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const active = getOpenGroup(location.pathname);
    return { [active]: true };
  });

  useEffect(() => {
    const active = getOpenGroup(location.pathname);
    setOpenGroups((prev) => ({ ...prev, [active]: true }));
  }, [location.pathname]);

  const closeAllGroups = () => {
    setOpenGroups({});
  };

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next: Record<string, boolean> = {};
      for (const k of Object.keys(prev)) {
        if (k !== key) next[k] = false;
      }
      next[key] = !prev[key];
      return next;
    });
  };

  const isActiveChild = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const hasActiveChild = (group: NavGroup) =>
    group.children.some((c) => isActiveChild(c.path));

  const closeMobile = () => {
    if (window.innerWidth < 1024) onToggle();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onToggle}
      />

      <aside
        className={`fixed top-0 left-0 h-full bg-[#0f172a] z-50 flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full lg:w-0 lg:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden">
              <img src="/src/assets/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight whitespace-nowrap">
              I-KIPUSHI
            </span>
          </div>
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors lg:hidden cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleGroups.map((group) => {
            if (group.standalone) {
              const active = isActiveChild(group.path!);
              return (
                <NavLink
                  key={group.key}
                  to={group.path!}
                  onClick={() => { closeAllGroups(); closeMobile(); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-l-4 ${
                    active
                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="shrink-0">{group.icon}</span>
                  <span className="whitespace-nowrap">{group.label}</span>
                </NavLink>
              );
            }

            const isOpen = openGroups[group.key] || false;
            const active = hasActiveChild(group);

            return (
              <div key={group.key}>
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-l-4 cursor-pointer ${
                    active
                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">{group.icon}</span>
                    <span className="whitespace-nowrap">{group.label}</span>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="ml-4 mt-1 space-y-0.5">
                    {group.children.map((child) => {
                      const childActive = isActiveChild(child.path);
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={closeMobile}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 border-l-4 ${
                            childActive
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500"
                              : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
                          }`}
                          style={{ paddingLeft: "2.5rem" }}
                        >
                          <span className="whitespace-nowrap">{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/5 shrink-0">
          <p className="text-[11px] text-slate-500 text-center">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
