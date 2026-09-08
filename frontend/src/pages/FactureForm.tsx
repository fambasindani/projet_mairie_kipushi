import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, FileSpreadsheet, DollarSign, FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import DropdownSearch from '../components/ui/DropdownSearch';
import { factureService } from '../services/factureService';
import { declarationService } from '../services/declarationService';

interface FactureFormState {
  declaration_paiement_id: string | number;
  montant_ht: string;
  montant_tva: string;
  devise: string;
  observations: string;
}

const EMPTY_FORM: FactureFormState = {
  declaration_paiement_id: '',
  montant_ht: '',
  montant_tva: '',
  devise: 'CDF',
  observations: '',
};

const deviseOptions = [
  { label: 'CDF', value: 'CDF' },
  { label: 'USD', value: 'USD' },
];

export default function FactureForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FactureFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [declarations, setDeclarations] = useState<{ label: string; value: number }[]>([]);
  const [loadingDeclarations, setLoadingDeclarations] = useState(false);

  const fetchDeclarations = useCallback(async () => {
    setLoadingDeclarations(true);
    try {
      const res = await declarationService.list({ per_page: 100 });
      setDeclarations(
        res.data.map((d) => ({
          label: `#${d.id} - ${d.personne?.nom ?? ''} (${d.taxe?.nom ?? ''})`,
          value: d.id,
        }))
      );
    } catch {
      // silently fail
    } finally {
      setLoadingDeclarations(false);
    }
  }, []);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.declaration_paiement_id) e.declaration_paiement_id = 'La déclaration est requise';
    if (!form.montant_ht.trim()) e.montant_ht = 'Le montant HT est requis';
    if (form.montant_ht.trim() && isNaN(Number(form.montant_ht))) e.montant_ht = 'Doit être un nombre';
    if (!form.montant_tva.trim()) e.montant_tva = 'Le montant TVA est requis';
    if (form.montant_tva.trim() && isNaN(Number(form.montant_tva))) e.montant_tva = 'Doit être un nombre';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const montantHt = Number(form.montant_ht);
      const montantTva = Number(form.montant_tva);
      const payload: Record<string, unknown> = {
        declaration_paiement_id: Number(form.declaration_paiement_id),
        montant_ht: montantHt,
        montant_tva: montantTva,
        montant_total: montantHt + montantTva,
        devise: form.devise,
        observations: form.observations || null,
      };
      await factureService.create(payload);
      toast.success('Facture créée');
      navigate('/factures');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/factures')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <FileSpreadsheet className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nouvelle facture</h1>
            <p className="mt-1 text-sm text-slate-500">Créer une nouvelle facture</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>Accueil</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/factures')}>Factures</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900">Nouveau</span>
        </nav>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <FileText className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Déclaration associée</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <DropdownSearch
                label="Déclaration de paiement *"
                options={declarations}
                value={form.declaration_paiement_id}
                onChange={(val) => setField('declaration_paiement_id', val)}
                placeholder="Sélectionner une déclaration..."
                loading={loadingDeclarations}
                error={errors.declaration_paiement_id}
              />
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
                  label="Montant HT *"
                  type="number"
                  step="0.01"
                  value={form.montant_ht}
                  onChange={(e) => setField('montant_ht', e.target.value)}
                  error={errors.montant_ht}
                  placeholder="0"
                />
                <Input
                  label="Montant TVA *"
                  type="number"
                  step="0.01"
                  value={form.montant_tva}
                  onChange={(e) => setField('montant_tva', e.target.value)}
                  error={errors.montant_tva}
                  placeholder="0"
                />
                <Select
                  label="Devise"
                  options={deviseOptions}
                  value={form.devise}
                  onChange={(e) => setField('devise', e.target.value)}
                  error={errors.devise}
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
            <Button variant="secondary" type="button" onClick={() => navigate('/factures')}>Annuler</Button>
            <Button type="submit" loading={submitting} icon={<Save size={16} />}>Créer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
