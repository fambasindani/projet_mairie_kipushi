import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, ClipboardCheck, User, FileText, Calendar } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DropdownSearch from '../components/ui/DropdownSearch';
import { permisService } from '../services/permisService';
import { personneService } from '../services/personneService';
import type { PermisAutorisation } from '../types';
import { FormSkeleton } from '../components/ui/Skeletons';

interface PermisFormState {
  personne_id: string | number;
  type_permis: string;
  numero: string;
  date_delivrance: string;
  date_expiration: string;
}

const EMPTY_FORM: PermisFormState = {
  personne_id: '',
  type_permis: '',
  numero: '',
  date_delivrance: '',
  date_expiration: '',
};

const typePermisOptions = [
  { label: 'Patente', value: 'patente' },
  { label: 'Construire', value: 'construire' },
  { label: 'Occupation du sol', value: 'occupation_sol' },
  { label: 'Étalage', value: 'etalage' },
  { label: 'Exploitation', value: 'exploitation' },
  { label: 'Transport', value: 'transport' },
  { label: 'Autre', value: 'autre' },
];

export default function PermisForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<PermisFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [personnes, setPersonnes] = useState<{ label: string; value: number }[]>([]);
  const [loadingPersonnes, setLoadingPersonnes] = useState(false);

  useEffect(() => {
    setLoadingPersonnes(true);
    personneService
      .list({ per_page: 500 })
      .then((res) => {
        setPersonnes(res.data.map((p) => ({ label: `${p.nom} ${p.prenom ?? ''}`.trim(), value: p.id })));
      })
      .catch(() => {})
      .finally(() => setLoadingPersonnes(false));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      permisService
        .get(Number(id))
        .then((data: PermisAutorisation) => {
          setForm({
            personne_id: data.personne_id,
            type_permis: data.type_permis,
            numero: data.numero,
            date_delivrance: data.date_delivrance ? data.date_delivrance.slice(0, 10) : '',
            date_expiration: data.date_expiration ? data.date_expiration.slice(0, 10) : '',
          });
          setLoading(false);
        })
        .catch(() => {
          toast.error('Erreur lors du chargement du permis');
          navigate('/permis');
        });
    }
  }, [id, isEdit, navigate]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.personne_id) e.personne_id = 'La personne est requise';
    if (!form.type_permis) e.type_permis = 'Le type de permis est requis';
    if (!form.numero.trim()) e.numero = 'Le numéro est requis';
    if (!form.date_delivrance) e.date_delivrance = 'La date de délivrance est requise';
    if (!form.date_expiration) e.date_expiration = "La date d'expiration est requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        personne_id: Number(form.personne_id),
        type_permis: form.type_permis,
        numero: form.numero,
        date_delivrance: form.date_delivrance,
        date_expiration: form.date_expiration,
      };

      if (isEdit && id) {
        await permisService.update(Number(id), payload);
        toast.success('Permis modifié');
      } else {
        await permisService.create(payload);
        toast.success('Permis créé');
      }
      navigate('/permis');
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, v]) => {
          fieldErrors[k] = v[0];
        });
        setErrors(fieldErrors);
      } else {
        toast.error(apiErr.message || 'Erreur lors de la soumission');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  if (loading) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/permis')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <ClipboardCheck className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Modifier le permis' : 'Nouveau permis'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isEdit ? `Modification du permis ${form.numero}` : 'Créer un nouveau permis ou autorisation'}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>Accueil</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/permis')}>Permis</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900">{isEdit ? 'Modifier' : 'Nouveau'}</span>
        </nav>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <User className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Personne</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <DropdownSearch
                label="Personne *"
                options={personnes}
                value={form.personne_id}
                onChange={(val) => setField('personne_id', val)}
                placeholder="Sélectionner une personne..."
                loading={loadingPersonnes}
                error={errors.personne_id}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <FileText className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Détails du permis</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Type de permis *"
                  options={typePermisOptions}
                  value={form.type_permis}
                  onChange={(e) => setField('type_permis', e.target.value)}
                  error={errors.type_permis}
                  placeholder="Sélectionner..."
                />
                <Input
                  label="Numéro *"
                  value={form.numero}
                  onChange={(e) => setField('numero', e.target.value)}
                  error={errors.numero}
                  placeholder="PERM-001"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Calendar className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Dates</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date de délivrance *"
                  type="date"
                  value={form.date_delivrance}
                  onChange={(e) => setField('date_delivrance', e.target.value)}
                  error={errors.date_delivrance}
                />
                <Input
                  label="Date d'expiration *"
                  type="date"
                  value={form.date_expiration}
                  onChange={(e) => setField('date_expiration', e.target.value)}
                  error={errors.date_expiration}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => navigate('/permis')}>Annuler</Button>
            <Button type="submit" loading={submitting} icon={<Save size={16} />}>{isEdit ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
