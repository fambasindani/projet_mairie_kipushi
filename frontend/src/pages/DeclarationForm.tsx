import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, FileText, User, DollarSign, Calendar } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import DropdownSearch from '../components/ui/DropdownSearch';
import { declarationService } from '../services/declarationService';
import { personneService } from '../services/personneService';
import { taxeService } from '../services/taxeService';
import { FormSkeleton } from '../components/ui/Skeletons';

interface DeclarationFormState {
  personne_id: string | number;
  taxe_id: string | number;
  exercice: string;
  periode_debut: string;
  periode_fin: string;
  montant_base: string;
  montant_taxe: string;
  penalites: string;
  date_limite_paiement: string;
  observations: string;
}

const EMPTY_FORM: DeclarationFormState = {
  personne_id: '',
  taxe_id: '',
  exercice: '',
  periode_debut: '',
  periode_fin: '',
  montant_base: '',
  montant_taxe: '',
  penalites: '0',
  date_limite_paiement: '',
  observations: '',
};

export default function DeclarationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<DeclarationFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [personnes, setPersonnes] = useState<{ label: string; value: number }[]>([]);
  const [taxes, setTaxes] = useState<{ label: string; value: number }[]>([]);
  const [loadingPersonnes, setLoadingPersonnes] = useState(false);
  const [loadingTaxes, setLoadingTaxes] = useState(false);

  const fetchPersonnes = useCallback(async () => {
    setLoadingPersonnes(true);
    try {
      const res = await personneService.list({ per_page: 100 });
      setPersonnes(res.data.map((p) => ({ label: `${p.nom} ${p.prenom ?? ''}`.trim(), value: p.id })));
    } catch {
      // silently fail
    } finally {
      setLoadingPersonnes(false);
    }
  }, []);

  const fetchTaxes = useCallback(async () => {
    setLoadingTaxes(true);
    try {
      const res = await taxeService.list({ per_page: 100 });
      setTaxes(res.data.map((t) => ({ label: t.nom, value: t.id })));
    } catch {
      // silently fail
    } finally {
      setLoadingTaxes(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonnes();
    fetchTaxes();
  }, [fetchPersonnes, fetchTaxes]);

  useEffect(() => {
    if (isEdit && id) {
      declarationService.get(Number(id)).then((data) => {
        setForm({
          personne_id: data.personne_id,
          taxe_id: data.taxe_id,
          exercice: String(data.exercice ?? ''),
          periode_debut: data.periode_debut ?? '',
          periode_fin: data.periode_fin ?? '',
          montant_base: String(data.montant_base ?? ''),
          montant_taxe: String(data.montant_taxe ?? ''),
          penalites: String(data.penalites ?? '0'),
          date_limite_paiement: data.date_limite_paiement ?? '',
          observations: data.observations ?? '',
        });
        setLoading(false);
      }).catch(() => {
        toast.error('Erreur lors du chargement de la déclaration');
        navigate('/declarations');
      });
    }
  }, [id, isEdit, navigate]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.personne_id) e.personne_id = 'L\'opérateur est requis';
    if (!form.taxe_id) e.taxe_id = 'La taxe est requise';
    if (!form.exercice.trim()) e.exercice = 'L\'exercice est requis';
    if (!form.periode_debut) e.periode_debut = 'La date de début est requise';
    if (!form.periode_fin) e.periode_fin = 'La date de fin est requise';
    if (!form.montant_base.trim()) e.montant_base = 'Le montant de base est requis';
    if (form.montant_base.trim() && isNaN(Number(form.montant_base))) e.montant_base = 'Doit être un nombre';
    if (!form.montant_taxe.trim()) e.montant_taxe = 'Le montant de la taxe est requis';
    if (form.montant_taxe.trim() && isNaN(Number(form.montant_taxe))) e.montant_taxe = 'Doit être un nombre';
    if (!form.date_limite_paiement) e.date_limite_paiement = 'La date limite est requise';
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
        taxe_id: Number(form.taxe_id),
        exercice: Number(form.exercice),
        periode_debut: form.periode_debut,
        periode_fin: form.periode_fin,
        montant_base: Number(form.montant_base),
        montant_taxe: Number(form.montant_taxe),
        penalites: Number(form.penalites) || 0,
        montant_total: Number(form.montant_taxe) + (Number(form.penalites) || 0),
        date_limite_paiement: form.date_limite_paiement,
        observations: form.observations || null,
      };
      if (isEdit && id) {
        await declarationService.update(Number(id), payload);
        toast.success('Déclaration modifiée');
      } else {
        await declarationService.create(payload);
        toast.success('Déclaration créée');
      }
      navigate('/declarations');
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, v]) => { fieldErrors[k] = v[0]; });
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
          <button onClick={() => navigate('/declarations')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <FileText className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Modifier la déclaration' : 'Nouvelle déclaration'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isEdit ? 'Modifier la déclaration de paiement' : 'Créer une déclaration de paiement'}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/')}>Accueil</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/declarations')}>Déclarations</span>
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
              <h3 className="text-sm font-bold text-slate-900">Informations de la déclaration</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DropdownSearch
                  label="Opérateur *"
                  options={personnes}
                  value={form.personne_id}
                  onChange={(val) => setField('personne_id', val)}
                  placeholder="Sélectionner un opérateur..."
                  loading={loadingPersonnes}
                  error={errors.personne_id}
                />
                <DropdownSearch
                  label="Taxe *"
                  options={taxes}
                  value={form.taxe_id}
                  onChange={(val) => setField('taxe_id', val)}
                  placeholder="Sélectionner une taxe..."
                  loading={loadingTaxes}
                  error={errors.taxe_id}
                />
                <Input
                  label="Exercice *"
                  type="number"
                  value={form.exercice}
                  onChange={(e) => setField('exercice', e.target.value)}
                  error={errors.exercice}
                  placeholder="2026"
                />
                <Input
                  label="Date limite paiement *"
                  type="date"
                  value={form.date_limite_paiement}
                  onChange={(e) => setField('date_limite_paiement', e.target.value)}
                  error={errors.date_limite_paiement}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Calendar className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Période</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Période début *"
                  type="date"
                  value={form.periode_debut}
                  onChange={(e) => setField('periode_debut', e.target.value)}
                  error={errors.periode_debut}
                />
                <Input
                  label="Période fin *"
                  type="date"
                  value={form.periode_fin}
                  onChange={(e) => setField('periode_fin', e.target.value)}
                  error={errors.periode_fin}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <DollarSign className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Montants</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Montant de base *"
                  type="number"
                  step="0.01"
                  value={form.montant_base}
                  onChange={(e) => setField('montant_base', e.target.value)}
                  error={errors.montant_base}
                  placeholder="0"
                />
                <Input
                  label="Montant taxe *"
                  type="number"
                  step="0.01"
                  value={form.montant_taxe}
                  onChange={(e) => setField('montant_taxe', e.target.value)}
                  error={errors.montant_taxe}
                  placeholder="0"
                />
                <Input
                  label="Pénalités"
                  type="number"
                  step="0.01"
                  value={form.penalites}
                  onChange={(e) => setField('penalites', e.target.value)}
                  error={errors.penalites}
                  placeholder="0"
                />
              </div>
              <Textarea
                label="Observations"
                value={form.observations}
                onChange={(e) => setField('observations', e.target.value)}
                error={errors.observations}
                placeholder="Notes ou observations..."
                rows={3}
                className="mt-4"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => navigate('/declarations')}>Annuler</Button>
            <Button type="submit" loading={submitting} icon={<Save size={16} />}>{isEdit ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
