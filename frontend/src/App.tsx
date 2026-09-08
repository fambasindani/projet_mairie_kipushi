import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Operateurs from "./pages/Operateurs";
import OperateurForm from "./pages/OperateurForm";
import OperateurDetail from "./pages/OperateurDetail";
import Utilisateurs from "./pages/Utilisateurs";
import UtilisateurForm from "./pages/UtilisateurForm";
import Roles from "./pages/Roles";
import RoleForm from "./pages/RoleForm";
import Permissions from "./pages/Permissions";
import Taxes from "./pages/Taxes";
import TaxeForm from "./pages/TaxeForm";
import Declarations from "./pages/Declarations";
import DeclarationForm from "./pages/DeclarationForm";
import RecusPerception from "./pages/RecusPerception";
import RecusPerceptionForm from "./pages/RecusPerceptionForm";
import Biens from "./pages/Biens";
import BienForm from "./pages/BienForm";
import Vehicules from "./pages/Vehicules";
import VehiculeForm from "./pages/VehiculeForm";
import Permis from "./pages/Permis";
import PermisForm from "./pages/PermisForm";
import Communes from "./pages/Communes";
import Quartiers from "./pages/Quartiers";
import Provinces from "./pages/Provinces";
import Villes from "./pages/Villes";
import Activites from "./pages/Activites";
import Notifications from "./pages/Notifications";
import Audit from "./pages/Audit";
import AuditDetail from "./pages/AuditDetail";
import Parametres from "./pages/Parametres";
import Profil from "./pages/Profil";
import Documents from "./pages/Documents";
import Identifiants from "./pages/Identifiants";
import IdentifiantDetail from "./pages/IdentifiantDetail";
import Inscription from "./pages/Inscription";
import Inscriptions from "./pages/Inscriptions";
import InscriptionDetail from "./pages/InscriptionDetail";
import LandingPage from "./pages/LandingPage";
import Rapports from "./pages/Rapports";

function OperateurRedirect() {
  const { user } = useAuth();
  const isOperateur = user?.roles?.some((r) => r.nom === "Operateur");
  if (isOperateur) return <Navigate to="/profil" replace />;
  return <Dashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "#fff",
              color: "#1f2a41",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
              border: "1px solid #edf2f8",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<OperateurRedirect />} />
              <Route path="/operateurs" element={<Operateurs />} />
              <Route path="/operateurs/nouveau" element={<OperateurForm />} />
              <Route path="/operateurs/:id" element={<OperateurDetail />} />
              <Route path="/operateurs/:id/modifier" element={<OperateurForm />} />
              <Route path="/utilisateurs" element={<Utilisateurs />} />
              <Route path="/utilisateurs/nouveau" element={<UtilisateurForm />} />
              <Route path="/utilisateurs/:id/modifier" element={<UtilisateurForm />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/roles/nouveau" element={<RoleForm />} />
              <Route path="/roles/:id/modifier" element={<RoleForm />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/taxes" element={<Taxes />} />
              <Route path="/taxes/nouveau" element={<TaxeForm />} />
              <Route path="/taxes/:id/modifier" element={<TaxeForm />} />
              <Route path="/declarations" element={<Declarations />} />
              <Route path="/declarations/nouveau" element={<DeclarationForm />} />
              <Route path="/declarations/:id/modifier" element={<DeclarationForm />} />
              <Route path="/recus-perception" element={<RecusPerception />} />
              <Route path="/recus-perception/nouveau" element={<RecusPerceptionForm />} />
              <Route path="/recus-perception/:id/modifier" element={<RecusPerceptionForm />} />
              <Route path="/biens" element={<Biens />} />
              <Route path="/biens/nouveau" element={<BienForm />} />
              <Route path="/biens/:id/modifier" element={<BienForm />} />
              <Route path="/vehicules" element={<Vehicules />} />
              <Route path="/vehicules/nouveau" element={<VehiculeForm />} />
              <Route path="/vehicules/:id/modifier" element={<VehiculeForm />} />
              <Route path="/permis" element={<Permis />} />
              <Route path="/permis/nouveau" element={<PermisForm />} />
              <Route path="/permis/:id/modifier" element={<PermisForm />} />
              <Route path="/communes" element={<Communes />} />
              <Route path="/quartiers" element={<Quartiers />} />
              <Route path="/provinces" element={<Provinces />} />
              <Route path="/villes" element={<Villes />} />
              <Route path="/activites" element={<Activites />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/audit/:id" element={<AuditDetail />} />
              <Route path="/parametres" element={<Parametres />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/identifiants" element={<Identifiants />} />
              <Route path="/identifiants/:id" element={<IdentifiantDetail />} />
              <Route path="/inscriptions" element={<Inscriptions />} />
              <Route path="/inscriptions/:id" element={<InscriptionDetail />} />
              <Route path="/rapports" element={<Rapports />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
