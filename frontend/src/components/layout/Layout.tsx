import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const pageTitles: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/operateurs": "Opérateurs",
  "/utilisateurs": "Utilisateurs",
  "/inscriptions": "Inscriptions",
  "/taxes": "Taxes",
  "/declarations": "Déclarations",
  "/recus-perception": "Reçus perception",
  "/biens": "Biens Immobiliers",
  "/vehicules": "Véhicules",
  "/permis": "Permis",
  "/communes": "Communes",
  "/activites": "Activités",
  "/notifications": "Notifications",
  "/audit": "Audit",
  "/parametres": "Paramètres",
  "/profil": "Profil",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    const basePath = `/${segments[0]}`;
    if (pageTitles[basePath]) return pageTitles[basePath];
    return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
  }
  return "Tableau de bord";
}

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div
        className={`transition-all duration-300 ${
          !sidebarCollapsed ? "lg:ml-[260px]" : "lg:ml-0"
        }`}
      >
        <Header title={pageTitle} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <Outlet />
        </main>

        <footer className="px-6 py-4 border-t border-border bg-white">
          <p className="text-center text-xs text-gray-400">
            &copy; 2026 GS Opérateur &mdash; Tous droits r&eacute;serv&eacute;s.
          </p>
        </footer>
      </div>
    </div>
  );
}
