import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Pencil, User, Phone, MapPin, Briefcase, FileText,
  Calendar, FolderOpen, Shield, ChevronRight, Trash2, Plus, Upload,
  Download, CheckCircle, X,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmModal from '../components/ui/ConfirmModal';
import { DetailSkeleton } from '../components/ui/Skeletons';
import { personneService } from '../services/personneService';
import { formatDate, formatDateTime } from '../utils/format';
import { identifiantService } from '../services/identifiantService';
import { activiteService } from '../services/activiteService';
import { documentService } from '../services/documentService';
import { get } from '../services/api';
import type { Personne, ActiviteEconomique, IdentifiantOfficiel, Document } from '../types';

type Tab = 'apercu' | 'activites' | 'identifiants' | 'documents';

const MENU_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'apercu', label: 'Aperçu', icon: <User size={18} /> },
  { key: 'activites', label: 'Activités', icon: <Briefcase size={18} /> },
  { key: 'identifiants', label: 'Identifiants', icon: <Shield size={18} /> },
  { key: 'documents', label: 'Documents', icon: <FolderOpen size={18} /> },
];

const docTypeLabels: Record<string, string> = {
  CNI: 'Carte Nationale d\'Identité',
  PASSEPORT: 'Passeport',
  STATUTS: 'Statuts',
  RCCM: 'Registre de Commerce',
  PATENTE: 'Patente',
  QUITTANCE: 'Quittance',
  AVATAR: 'Photo de profil',
  AUTRE: 'Autre',
};

const identTypeLabels: Record<string, string> = {
  RCCM: 'Registre de Commerce',
  IDNAT: 'Carte Nationale d\'Identité',
  NUMERO_IMPOT: 'Numéro d\'Impôt',
  NIF: 'NIF',
  CNSS: 'CNSS',
  ONEM: 'ONEM',
  PASSEPORT: 'Passeport',
  PERMIS_CONDURE: 'Permis de Conduire',
};

export default function OperateurDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [operateur, setOperateur] = useState<Personne | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('apercu');

  const [activites, setActivites] = useState<ActiviteEconomique[]>([]);
  const [allActivites, setAllActivites] = useState<ActiviteEconomique[]>([]);
  const [showAddActivite, setShowAddActivite] = useState(false);

  const [identifiants, setIdentifiants] = useState<IdentifiantOfficiel[]>([]);
  const [newIdentifiant, setNewIdentifiant] = useState({ type_identifiant: 'RCCM', valeur: '', date_delivrance: '', date_expiration: '' });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('CNI');
  const [docNumero, setDocNumero] = useState('');
  const [uploading, setUploading] = useState(false);

  const [confirmActivite, setConfirmActivite] = useState<ActiviteEconomique | null>(null);
  const [confirmIdentifiant, setConfirmIdentifiant] = useState<IdentifiantOfficiel | null>(null);
  const [confirmDocument, setConfirmDocument] = useState<Document | null>(null);

  const [editingIdentifiant, setEditingIdentifiant] = useState<IdentifiantOfficiel | null>(null);
  const [editingActivite, setEditingActivite] = useState<ActiviteEconomique | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadDocuments = useCallback(async () => {
    try {
      const res = await documentService.byPersonne(Number(id));
      const items = Array.isArray(res) ? res : ((res as unknown as { data?: Document[] })?.data ?? []);
      setDocuments(items);
    } catch { setDocuments([]); }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);

    const load = async () => {
      try {
        const personne = await personneService.get(numId);
        setOperateur(personne);
      } catch {
        toast.error('Opérateur non trouvé');
        navigate('/operateurs');
        return;
      }

      try {
        const acts = await get<ActiviteEconomique[]>(`/operateur-activites/${numId}`);
        setActivites(Array.isArray(acts) ? acts : []);
      } catch { setActivites([]); }

      try {
        const ids = await identifiantService.list({ personne_id: numId, per_page: 100 });
        setIdentifiants(ids?.data ?? []);
      } catch { setIdentifiants([]); }

      try {
        const all = await activiteService.list({ per_page: 200 });
        setAllActivites(all?.data ?? []);
      } catch { setAllActivites([]); }

      try {
        const docs = await documentService.byPersonne(numId);
        const items = Array.isArray(docs) ? docs : ((docs as unknown as { data?: Document[] })?.data ?? []);
        setDocuments(items);
      } catch { setDocuments([]); }

      setLoading(false);
    };

    load();
  }, [id, navigate]);

  const handleAssignActivite = async (activite: ActiviteEconomique) => {
    try {
      await get(`/operateur-activites/${id}`);
      const { post } = await import('../services/api');
      await post('/operateur-activites/assigner', {
        personne_id: Number(id),
        activites: [{ id: activite.id, est_principale: false }],
      });
      setActivites((prev) => [...prev, activite]);
      setShowAddActivite(false);
      toast.success('Activité ajoutée');
    } catch {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleRemoveActivite = async () => {
    if (!confirmActivite) return;
    try {
      const { del } = await import('../services/api');
      await del(`/operateur-activites/${id}/${confirmActivite.id}`);
      setActivites((prev) => prev.filter((a) => a.id !== confirmActivite.id));
      toast.success('Activité retirée');
    } catch {
      toast.error('Erreur');
    } finally {
      setConfirmActivite(null);
    }
  };

  const handleAddIdentifiant = async () => {
    const errors: Record<string, string> = {};
    if (!newIdentifiant.valeur.trim()) errors.valeur = 'Le numéro / valeur est requis';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setFormErrors({});
    try {
      const res = await identifiantService.create({
        personne_id: Number(id),
        type_identifiant: newIdentifiant.type_identifiant as IdentifiantOfficiel['type_identifiant'],
        valeur: newIdentifiant.valeur,
        date_delivrance: newIdentifiant.date_delivrance || undefined,
        date_expiration: newIdentifiant.date_expiration || undefined,
      });
      setIdentifiants((prev) => [...prev, res]);
      setNewIdentifiant({ type_identifiant: 'RCCM', valeur: '', date_delivrance: '', date_expiration: '' });
      toast.success('Identifiant ajouté');
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const firstKey = Object.keys(apiErr.errors)[0];
        toast.error(apiErr.errors[firstKey][0]);
      } else {
        toast.error(apiErr.message || 'Erreur lors de l\'ajout');
      }
    }
  };

  const handleDeleteIdentifiant = async () => {
    if (!confirmIdentifiant) return;
    try {
      await identifiantService.delete(confirmIdentifiant.id);
      setIdentifiants((prev) => prev.filter((i) => i.id !== confirmIdentifiant.id));
      toast.success('Identifiant supprimé');
    } catch {
      toast.error('Erreur');
    } finally {
      setConfirmIdentifiant(null);
    }
  };

  const handleEditIdentifiant = async (ident: IdentifiantOfficiel) => {
    try {
      const res = await identifiantService.update(ident.id, {
        type_identifiant: ident.type_identifiant,
        valeur: ident.valeur,
        date_delivrance: ident.date_delivrance || undefined,
        date_expiration: ident.date_expiration || undefined,
      });
      setIdentifiants((prev) => prev.map((i) => i.id === res.id ? res : i));
      toast.success('Identifiant modifié');
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const firstKey = Object.keys(apiErr.errors)[0];
        toast.error(apiErr.errors[firstKey][0]);
      } else {
        toast.error(apiErr.message || 'Erreur');
      }
    }
  };

  const handleUploadDoc = async () => {
    if (!docFile) { toast.error('Sélectionnez un fichier'); return; }
    setUploading(true);
    try {
      await documentService.upload(Number(id), docFile, docType, docNumero || undefined);
      toast.success('Document uploadé');
      setDocFile(null);
      setDocNumero('');
      setDocType('CNI');
      loadDocuments();
    } catch {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDoc = async (doc: Document) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(documentService.downloadUrl(doc.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.fichier.split('/').pop() ?? `document_${doc.id}`;
      window.document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDeleteDoc = async () => {
    if (!confirmDocument) return;
    try {
      await documentService.delete(confirmDocument.id);
      setDocuments((prev) => prev.filter((d) => d.id !== confirmDocument.id));
      toast.success('Document supprimé');
    } catch {
      toast.error('Erreur');
    } finally {
      setConfirmDocument(null);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!operateur) return null;

  const assignedIds = new Set(activites.map((a) => a.id));
  const availableActivites = allActivites.filter((a) => !assignedIds.has(a.id));

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-700">{value || <span className="text-slate-300 italic">Non renseigné</span>}</span>
    </div>
  );

  const renderApercu = () => (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><User className="text-sm" /></span>
          <h3 className="text-sm font-bold text-slate-900">Informations générales</h3>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <InfoRow label="Nom" value={operateur.nom} />
            <InfoRow label="Prénom" value={operateur.prenom} />
            <InfoRow label="Date de naissance" value={formatDate(operateur.date_naissance)} />
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
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><Phone className="text-sm" /></span>
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
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><MapPin className="text-sm" /></span>
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
    </div>
  );

  const renderActivites = () => (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><Briefcase className="text-sm" /></span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Activités économiques</h3>
            <p className="text-xs text-slate-400">{activites.length} assignée(s)</p>
          </div>
        </div>
        {!showAddActivite && availableActivites.length > 0 && (
          <Button icon={<Plus size={14} />} size="sm" onClick={() => setShowAddActivite(true)}>Ajouter</Button>
        )}
      </div>

      {activites.length > 0 && (
        <div className="space-y-2 mb-4">
          {activites.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Briefcase size={16} /></span>
                <div>
                  <p className="text-sm font-medium text-slate-700">{a.nom}</p>
                  {a.secteur && <p className="text-xs text-slate-400">{a.secteur}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditingActivite(a)} className="p-2 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition cursor-pointer" title="Modifier"><Pencil size={14} /></button>
                <button onClick={() => setConfirmActivite(a)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer" title="Supprimer"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activites.length === 0 && !showAddActivite && (
        <p className="text-sm text-slate-400 italic text-center py-4">Aucune activité assignée</p>
      )}

      {showAddActivite && (
        <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">Sélectionner une activité</h4>
            <button onClick={() => setShowAddActivite(false)} className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 transition cursor-pointer"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {availableActivites.map((a) => (
              <button key={a.id} onClick={() => handleAssignActivite(a)}
                className="text-left p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all cursor-pointer">
                {a.nom}
                {a.secteur && <span className="block text-xs text-slate-400 mt-0.5">{a.secteur}</span>}
              </button>
            ))}
          </div>
          {availableActivites.length === 0 && <p className="text-sm text-slate-400 text-center py-2">Toutes les activités sont déjà assignées</p>}
        </div>
      )}
    </div>
  );

  const renderIdentifiants = () => {
    const identTypeOptions = Object.entries(identTypeLabels).map(([value, label]) => ({ label, value }));
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><Shield className="text-sm" /></span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Identifiants officiels</h3>
              <p className="text-xs text-slate-400">{identifiants.length} enregistré(s)</p>
            </div>
          </div>

          {identifiants.length > 0 ? (
            <div className="space-y-2 mb-6">
              {identifiants.map((ident) => (
                <div key={ident.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60"><Shield size={16} className="text-indigo-500" /></span>
                    <div>
                      <span className="text-sm font-semibold text-slate-700">{identTypeLabels[ident.type_identifiant] ?? ident.type_identifiant}</span>
                      <p className="text-sm text-slate-600">{ident.valeur}</p>
                      {ident.date_expiration && <p className="text-xs text-slate-400">Exp. {formatDate(ident.date_expiration)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingIdentifiant(ident)} className="p-2 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition cursor-pointer" title="Modifier"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmIdentifiant(ident)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer" title="Supprimer"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-4 mb-6">Aucun identifiant enregistré</p>
          )}
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Plus className="text-sm" /></span>
            <h3 className="text-sm font-bold text-slate-900">Ajouter un identifiant</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Type" options={identTypeOptions} value={newIdentifiant.type_identifiant} onChange={(e) => setNewIdentifiant((p) => ({ ...p, type_identifiant: e.target.value }))} />
            <Input label="Numéro / Valeur *" value={newIdentifiant.valeur} onChange={(e) => { setNewIdentifiant((p) => ({ ...p, valeur: e.target.value })); if (formErrors.valeur) setFormErrors((p) => ({ ...p, valeur: '' })); }} placeholder="Ex: 012345678" error={formErrors.valeur} />
            <Input label="Date de délivrance" type="date" value={newIdentifiant.date_delivrance} onChange={(e) => setNewIdentifiant((p) => ({ ...p, date_delivrance: e.target.value }))} />
            <Input label="Date d'expiration" type="date" value={newIdentifiant.date_expiration} onChange={(e) => setNewIdentifiant((p) => ({ ...p, date_expiration: e.target.value }))} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button icon={<Plus size={14} />} size="sm" onClick={handleAddIdentifiant}>Enregistrer</Button>
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><Upload className="text-sm" /></span>
          <h3 className="text-sm font-bold text-slate-900">Ajouter un document</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select label="Type" options={Object.entries(docTypeLabels).map(([value, label]) => ({ label, value }))} value={docType} onChange={(e) => setDocType(e.target.value)} />
          <Input label="Numéro" value={docNumero} onChange={(e) => setDocNumero(e.target.value)} placeholder="Optionnel" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fichier</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 file:cursor-pointer" />
          </div>
          <div className="flex items-end">
            <Button icon={<Upload size={14} />} size="sm" onClick={handleUploadDoc} disabled={!docFile || uploading} className="!w-full">
              {uploading ? 'Envoi...' : 'Uploader'}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><FolderOpen className="text-sm" /></span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Documents enregistrés</h3>
            <p className="text-xs text-slate-400">{documents.length} document(s)</p>
          </div>
        </div>

        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><FileText size={16} /></span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{docTypeLabels[doc.type_document] ?? doc.type_document}</p>
                    <p className="text-xs text-slate-400">
                      {doc.numero ? `N° ${doc.numero}` : '—'}
                      {doc.date_expiration && ` · Exp. ${formatDate(doc.date_expiration)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={doc.est_valide ? 'success' : 'danger'}>{doc.est_valide ? 'Valide' : 'Invalide'}</Badge>
                  <button onClick={() => handleDownloadDoc(doc)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition cursor-pointer" title="Télécharger"><Download size={15} /></button>
                  <button onClick={() => setConfirmDocument(doc)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer" title="Supprimer"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderOpen size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">Aucun document enregistré</p>
          </div>
        )}
      </div>
    </div>
  );

  const tabContent: Record<Tab, () => React.ReactNode> = {
    apercu: renderApercu,
    activites: renderActivites,
    identifiants: renderIdentifiants,
    documents: renderDocuments,
  };

  const tabCounts: Partial<Record<Tab, number>> = {
    activites: activites?.length ?? 0,
    identifiants: identifiants?.length ?? 0,
    documents: documents?.length ?? 0,
  };

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
              <Badge variant={operateur.type === 'physique' ? 'info' : 'warning'}>{operateur.type === 'physique' ? 'Physique' : 'Morale'}</Badge>
              <Badge variant={operateur.est_actif ? 'success' : 'danger'}>{operateur.est_actif ? 'Actif' : 'Inactif'}</Badge>
              {operateur.est_formalise && <Badge variant="info">Formalisé</Badge>}
            </div>
          </div>
        </div>
        <Button icon={<Pencil size={16} />} onClick={() => navigate(`/operateurs/${operateur.id}/modifier`)}>Modifier</Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="w-full lg:w-64 shrink-0">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-2">
            {MENU_ITEMS.map((item) => (
              <button key={item.key} onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === item.key ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                <div className="flex items-center gap-3">
                  <span className={activeTab === item.key ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
                  {item.label}
                </div>
                <div className="flex items-center gap-2">
                  {tabCounts[item.key] != null && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === item.key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      {tabCounts[item.key]}
                    </span>
                  )}
                  {activeTab === item.key && <ChevronRight size={14} className="text-indigo-400" />}
                </div>
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {tabContent[activeTab]()}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmActivite}
        onClose={() => setConfirmActivite(null)}
        onConfirm={handleRemoveActivite}
        title="Retirer l'activité"
        message={`Retirer l'activité "${confirmActivite?.nom}" de cet opérateur ?`}
        confirmText="Retirer"
        variant="warning"
      />

      <ConfirmModal
        isOpen={!!confirmIdentifiant}
        onClose={() => setConfirmIdentifiant(null)}
        onConfirm={handleDeleteIdentifiant}
        title="Supprimer l'identifiant"
        message={`Supprimer l'identifiant "${confirmIdentifiant?.type_identifiant} - ${confirmIdentifiant?.valeur}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!confirmDocument}
        onClose={() => setConfirmDocument(null)}
        onConfirm={handleDeleteDoc}
        title="Supprimer le document"
        message={`Supprimer le document "${docTypeLabels[confirmDocument?.type_document ?? '']}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />

      {editingActivite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingActivite(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">Modifier l'activité</h3>
            <div className="space-y-3">
              <Input label="Nom" value={editingActivite.nom}
                onChange={(e) => setEditingActivite((p) => p ? { ...p, nom: e.target.value } : p)} />
              <Input label="Secteur" value={editingActivite.secteur ?? ''}
                onChange={(e) => setEditingActivite((p) => p ? { ...p, secteur: e.target.value || null } : p)} />
              <Input label="Description" value={editingActivite.description ?? ''}
                onChange={(e) => setEditingActivite((p) => p ? { ...p, description: e.target.value || null } : p)} />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setEditingActivite(null)}>Annuler</Button>
              <Button onClick={async () => {
                try {
                  const res = await activiteService.update(editingActivite.id, { nom: editingActivite.nom, secteur: editingActivite.secteur, description: editingActivite.description });
                  setActivites((prev) => prev.map((a) => a.id === res.id ? res : a));
                  setAllActivites((prev) => prev.map((a) => a.id === res.id ? res : a));
                  toast.success('Activité modifiée');
                } catch { toast.error('Erreur'); }
                setEditingActivite(null);
              }}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}

      {editingIdentifiant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingIdentifiant(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">Modifier l'identifiant</h3>
            <div className="space-y-3">
              <Select label="Type"
                options={Object.entries(identTypeLabels).map(([value, label]) => ({ label, value }))}
                value={editingIdentifiant.type_identifiant}
                onChange={(e) => setEditingIdentifiant((p) => p ? { ...p, type_identifiant: e.target.value as IdentifiantOfficiel['type_identifiant'] } : p)} />
              <Input label="Valeur" value={editingIdentifiant.valeur}
                onChange={(e) => setEditingIdentifiant((p) => p ? { ...p, valeur: e.target.value } : p)} />
              <Input label="Date de délivrance" type="date" value={editingIdentifiant.date_delivrance ?? ''}
                onChange={(e) => setEditingIdentifiant((p) => p ? { ...p, date_delivrance: e.target.value || null } : p)} />
              <Input label="Date d'expiration" type="date" value={editingIdentifiant.date_expiration ?? ''}
                onChange={(e) => setEditingIdentifiant((p) => p ? { ...p, date_expiration: e.target.value || null } : p)} />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setEditingIdentifiant(null)}>Annuler</Button>
              <Button onClick={async () => { await handleEditIdentifiant(editingIdentifiant); setEditingIdentifiant(null); }}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
