import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Shield, Pencil, User, Calendar, MapPin } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { DetailSkeleton } from '../components/ui/Skeletons';
import { identifiantService } from '../services/identifiantService';
import type { IdentifiantOfficiel } from '../types';

const typeLabels: Record<string, string> = {
  RCCM: 'Registre de Commerce',
  IDNAT: 'Carte Nationale d\'Identité',
  NUMERO_IMPOT: 'Numéro d\'Impôt',
  NIF: 'NIF',
  CNSS: 'CNSS',
  ONEM: 'ONEM',
  PASSEPORT: 'Passeport',
  PERMIS_CONDURE: 'Permis de Conduire',
};

export default function IdentifiantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState<IdentifiantOfficiel | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type_identifiant: '', valeur: '', province_delivrance: '', date_delivrance: '', date_expiration: '' });

  useEffect(() => {
    if (!id) return;
    identifiantService.get(Number(id))
      .then((data) => {
        setIdentifiant(data);
        setForm({
          type_identifiant: data.type_identifiant,
          valeur: data.valeur,
          province_delivrance: data.province_delivrance ?? '',
          date_delivrance: data.date_delivrance ?? '',
          date_expiration: data.date_expiration ?? '',
        });
        setLoading(false);
      })
      .catch(() => {
        toast.error('Identifiant non trouvé');
        navigate('/identifiants');
      });
  }, [id, navigate]);

  const handleSave = async () => {
    if (!form.valeur.trim()) {
      toast.error('La valeur est requise');
      return;
    }
    setSaving(true);
    try {
      const res = await identifiantService.update(Number(id), {
        type_identifiant: form.type_identifiant as IdentifiantOfficiel['type_identifiant'],
        valeur: form.valeur,
        province_delivrance: form.province_delivrance || undefined,
        date_delivrance: form.date_delivrance || undefined,
        date_expiration: form.date_expiration || undefined,
      });
      setIdentifiant(res);
      setEditing(false);
      toast.success('Identifiant modifié');
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const firstKey = Object.keys(apiErr.errors)[0];
        toast.error(apiErr.errors[firstKey][0]);
      } else {
        toast.error(apiErr.message || 'Erreur');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!identifiant) return null;

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-700">{value || <span className="text-slate-300 italic">Non renseigné</span>}</span>
    </div>
  );

  const identTypeOptions = Object.entries(typeLabels).map(([value, label]) => ({ label, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/identifiants')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Shield className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {typeLabels[identifiant.type_identifiant] ?? identifiant.type_identifiant}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="info">{identifiant.valeur}</Badge>
              <Badge variant={identifiant.est_actif ? 'success' : 'danger'}>
                {identifiant.est_actif ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </div>
        {!editing && (
          <Button icon={<Pencil size={16} />} onClick={() => setEditing(true)}>Modifier</Button>
        )}
      </div>

      {identifiant.personne && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><User className="text-sm" /></span>
            <h3 className="text-sm font-bold text-slate-900">Opérateur associé</h3>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <InfoRow label="Nom" value={identifiant.personne.nom} />
              <InfoRow label="Prénom" value={identifiant.personne.prenom} />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><Shield className="text-sm" /></span>
          <h3 className="text-sm font-bold text-slate-900">Détails de l'identifiant</h3>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          {editing ? (
            <div className="space-y-4">
              <Select label="Type" options={identTypeOptions} value={form.type_identifiant} onChange={(e) => setForm((p) => ({ ...p, type_identifiant: e.target.value }))} />
              <Input label="Valeur" value={form.valeur} onChange={(e) => setForm((p) => ({ ...p, valeur: e.target.value }))} />
              <Input label="Province de délivrance" value={form.province_delivrance} onChange={(e) => setForm((p) => ({ ...p, province_delivrance: e.target.value }))} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Date de délivrance" type="date" value={form.date_delivrance} onChange={(e) => setForm((p) => ({ ...p, date_delivrance: e.target.value }))} />
                <Input label="Date d'expiration" type="date" value={form.date_expiration} onChange={(e) => setForm((p) => ({ ...p, date_expiration: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="secondary" onClick={() => { setEditing(false); setForm({ type_identifiant: identifiant.type_identifiant, valeur: identifiant.valeur, province_delivrance: identifiant.province_delivrance ?? '', date_delivrance: identifiant.date_delivrance ?? '', date_expiration: identifiant.date_expiration ?? '' }); }}>Annuler</Button>
                <Button onClick={handleSave} loading={saving}>Enregistrer</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <InfoRow label="Type" value={typeLabels[identifiant.type_identifiant] ?? identifiant.type_identifiant} />
              <InfoRow label="Valeur" value={identifiant.valeur} />
              <InfoRow label="Province de délivrance" value={identifiant.province_delivrance} />
              <InfoRow label="Date de délivrance" value={identifiant.date_delivrance ? new Date(identifiant.date_delivrance).toLocaleDateString('fr-FR') : null} />
              <InfoRow label="Date d'expiration" value={identifiant.date_expiration ? new Date(identifiant.date_expiration).toLocaleDateString('fr-FR') : null} />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><Calendar className="text-sm" /></span>
          <h3 className="text-sm font-bold text-slate-900">Dates</h3>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <InfoRow label="Créé le" value={identifiant.created_at ? new Date(identifiant.created_at).toLocaleDateString('fr-FR') : null} />
            <InfoRow label="Modifié le" value={identifiant.updated_at ? new Date(identifiant.updated_at).toLocaleDateString('fr-FR') : null} />
          </div>
        </div>
      </div>
    </div>
  );
}
