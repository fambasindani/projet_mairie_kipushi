import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Receipt, Hash, DollarSign, Calendar } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { taxeService } from '../services/taxeService';
import type { Taxe } from '../types';
import { FormSkeleton } from '../components/ui/Skeletons';

interface TaxeFormState {
  code: string;
  nom: string;
  categorie: string;
  description: string;
  taux: string;
  unite: string;
  periodicite: string;
  est_locale: boolean;
}

const EMPTY_FORM: TaxeFormState = {
  code: '',
  nom: '',
  categorie: '',
  description: '',
  taux: '',
  unite: 'pourcentage',
  periodicite: 'annuelle',
  est_locale: false,
};

const categorieOptions = [
  { label: 'Patente', value: 'patente' },
  { label: 'Foncier', value: 'foncier' },
  { label: 'Revenus locatifs', value: 'revenus_locatifs' },
  { label: 'Personnel minimum', value: 'personnel_minimum' },
  { label: 'Véhicule', value: 'vehicule' },
  { label: 'Permis construire', value: 'permis_construire' },
  { label: 'Étalage', value: 'etalage' },
  { label: 'Autre', value: 'autre' },
];

const uniteOptions = [
  { label: 'Pourcentage', value: 'pourcentage' },
  { label: 'Montant fixe', value: 'montant_fixe' },
  { label: 'Par unité', value: 'par_unite' },
];

const periodiciteOptions = [
  { label: 'Mensuelle', value: 'mensuelle' },
  { label: 'Trimestrielle', value: 'trimestrielle' },
  { label: 'Semestrielle', value: 'semestrielle' },
  { label: 'Annuelle', value: 'annuelle' },
  { label: 'Événementielle', value: 'evenementielle' },
];

export default function TaxeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<TaxeFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && id) {
      taxeService.get(Number(id)).then((data: Taxe) => {
        setForm({
          code: data.code,
          nom: data.nom,
          categorie: data.categorie,
          description: data.description ?? '',
          taux: data.taux != null ? String(data.taux) : '',
          unite: data.unite,
          periodicite: data.periodicite,
          est_locale: data.est_locale,
        });
        setLoading(false);
      }).catch(() => {
        toast.error('Erreur lors du chargement de la taxe');
        navigate('/taxes');
      });
    }
  }, [id, isEdit, navigate]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Le code est requis';
    if (!form.nom.trim()) e.nom = 'Le nom est requis';
    if (!form.categorie) e.categorie = 'La catégorie est requise';
    if (!form.taux.trim()) e.taux = 'Le taux/montant est requis';
    if (form.taux.trim() && isNaN(Number(form.taux))) e.taux = 'Le taux doit être un nombre';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        code: form.code,
        nom: form.nom,
        categorie: form.categorie,
        description: form.description || null,
        taux: Number(form.taux),
        unite: form.unite,
        periodicite: form.periodicite,
        est_locale: form.est_locale,
      };

      if (isEdit && id) {
        await taxeService.update(Number(id), payload);
        toast.success('Taxe modifiée');
      } else {
        await taxeService.create(payload);
        toast.success('Taxe créée');
      }
      navigate('/taxes');
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

  const setField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  if (loading) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/taxes')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Receipt className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Modifier la taxe' : 'Nouvelle taxe'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isEdit ? `Modification de ${form.nom}` : 'Créer une nouvelle taxe'}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/')}>Accueil</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/taxes')}>Taxes</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900">{isEdit ? 'Modifier' : 'Nouveau'}</span>
        </nav>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Hash className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Informations de la taxe</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Code *"
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value)}
                  error={errors.code}
                  placeholder="TAX-001"
                />
                <Input
                  label="Nom *"
                  value={form.nom}
                  onChange={(e) => setField('nom', e.target.value)}
                  error={errors.nom}
                  placeholder="Nom de la taxe"
                />
                <Select
                  label="Catégorie *"
                  options={categorieOptions}
                  value={form.categorie}
                  onChange={(e) => setField('categorie', e.target.value)}
                  error={errors.categorie}
                  placeholder="Sélectionner..."
                />
                <Input
                  label="Taux / Montant *"
                  type="number"
                  step="0.01"
                  value={form.taux}
                  onChange={(e) => setField('taux', e.target.value)}
                  error={errors.taux}
                  placeholder="0"
                />
                <Select
                  label="Unité"
                  options={uniteOptions}
                  value={form.unite}
                  onChange={(e) => setField('unite', e.target.value)}
                  error={errors.unite}
                />
                <Select
                  label="Périodicité"
                  options={periodiciteOptions}
                  value={form.periodicite}
                  onChange={(e) => setField('periodicite', e.target.value)}
                  error={errors.periodicite}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <DollarSign className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Détails</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <Textarea
                label="Description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                error={errors.description}
                placeholder="Description de la taxe..."
                rows={3}
              />
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="est_locale"
                  checked={form.est_locale}
                  onChange={(e) => setField('est_locale', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
                />
                <label htmlFor="est_locale" className="text-sm text-gray-700 cursor-pointer">
                  Taxe locale
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => navigate('/taxes')}>Annuler</Button>
            <Button type="submit" loading={submitting} icon={<Save size={16} />}>{isEdit ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
