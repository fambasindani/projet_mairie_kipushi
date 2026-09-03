import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, User, Phone, MapPin, Briefcase, FileText, Calendar, FolderOpen } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DocumentModal from '../components/DocumentModal';
import { DetailSkeleton } from '../components/ui/Skeletons';
import { personneService } from '../services/personneService';
import type { Personne } from '../types';

export default function OperateurDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [operateur, setOperateur] = useState<Personne | null>(null);
  const [loading, setLoading] = useState(true);
  const [docModalOpen, setDocModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    personneService.get(Number(id))
      .then((data) => {
        setOperateur(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Opérateur non trouvé');
        navigate('/operateurs');
      });
  }, [id, navigate]);

  if (loading) return <DetailSkeleton />;

  if (!operateur) return null;

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-700">{value || <span className="text-slate-300 italic">Non renseigné</span>}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/operateurs')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <User className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {operateur.type === 'physique' ? `${operateur.nom} ${operateur.prenom ?? ''}`.trim() : operateur.nom}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={operateur.type === 'physique' ? 'info' : 'warning'}>
                {operateur.type === 'physique' ? 'Physique' : 'Morale'}
              </Badge>
              <Badge variant={operateur.est_actif ? 'success' : 'danger'}>
                {operateur.est_actif ? 'Actif' : 'Inactif'}
              </Badge>
              {operateur.est_formalise && <Badge variant="info">Formalisé</Badge>}
            </div>
          </div>
        </div>
        <Button icon={<Pencil size={16} />} onClick={() => navigate(`/operateurs/${operateur.id}/modifier`)}>
          Modifier
        </Button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <User className="text-sm" />
          </span>
          <h3 className="text-sm font-bold text-slate-900">Informations générales</h3>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <InfoRow label="Nom" value={operateur.nom} />
            <InfoRow label="Prénom" value={operateur.prenom} />
            <InfoRow label="Date de naissance" value={operateur.date_naissance} />
            <InfoRow label="Lieu de naissance" value={operateur.lieu_naissance} />
            <InfoRow label="Nationalité" value={operateur.nationalite} />
            <InfoRow label="Sexe" value={operateur.sexe === 'M' ? 'Masculin' : operateur.sexe === 'F' ? 'Féminin' : null} />
            <InfoRow label="CNI N°" value={operateur.cni_numero} />
            {operateur.type === 'morale' && (
              <>
                <InfoRow label="Dénomination sociale" value={operateur.denomination_sociale} />
                <InfoRow label="Forme juridique" value={operateur.forme_juridique} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Phone className="text-sm" />
          </span>
          <h3 className="text-sm font-bold text-slate-900">Coordonnées</h3>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <InfoRow label="Téléphone" value={operateur.telephone} />
            <InfoRow label="Téléphone 2" value={operateur.telephone_2} />
            <InfoRow label="Email" value={operateur.email} />
            <InfoRow label="Adresse" value={operateur.adresse} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <MapPin className="text-sm" />
          </span>
          <h3 className="text-sm font-bold text-slate-900">Localisation</h3>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <InfoRow label="Province" value={operateur.province} />
            <InfoRow label="Ville" value={operateur.ville} />
            <InfoRow label="Commune" value={operateur.commune} />
            <InfoRow label="Quartier" value={operateur.quartier} />
          </div>
        </div>
      </div>

      {operateur.activites && operateur.activites.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Briefcase className="text-sm" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Activités économiques</h3>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
            <div className="flex flex-wrap gap-2">
              {operateur.activites.map((a) => (
                <Badge key={a.id} variant="info">{a.nom}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <FolderOpen className="text-sm" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Documents</h3>
          </div>
          <Button icon={<FileText size={14} />} size="sm" onClick={() => setDocModalOpen(true)}>
            Gérer les documents
          </Button>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <p className="text-sm text-slate-500">Cliquez sur le bouton pour gérer les documents de cet opérateur.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Calendar className="text-sm" />
          </span>
          <h3 className="text-sm font-bold text-slate-900">Dates</h3>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <InfoRow label="Créé le" value={operateur.created_at ? new Date(operateur.created_at).toLocaleDateString('fr-FR') : null} />
            <InfoRow label="Modifié le" value={operateur.updated_at ? new Date(operateur.updated_at).toLocaleDateString('fr-FR') : null} />
            <InfoRow label="Formalisé le" value={operateur.date_formalisation ? new Date(operateur.date_formalisation).toLocaleDateString('fr-FR') : null} />
          </div>
        </div>
      </div>

      <DocumentModal isOpen={docModalOpen} onClose={() => setDocModalOpen(false)} personneId={operateur.id} />
    </div>
  );
}
