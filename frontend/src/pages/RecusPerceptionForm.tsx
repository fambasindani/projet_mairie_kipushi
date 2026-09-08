import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Receipt, MapPin, Clock, Car, Truck, FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { recuPerceptionService, type RecuPerceptionCreate, type TypePerception, typePerceptionLabels } from '../services/recuPerceptionService';
import { taxeService } from '../services/taxeService';
import type { Taxe } from '../types';
import { FormSkeleton } from '../components/ui/Skeletons';

const EMPTY_FORM: RecuPerceptionCreate = {
  taxe_id: 0,
  type_perception: 'peage_urbain',
  date_emission: new Date().toISOString().split('T')[0],
  heure_emission: new Date().toTimeString().slice(0, 5),
  categorie_vehicule: '',
  plaque_immatriculation: '',
  montant: 0,
  trajet: 'aller',
  chauffeur_nom: '',
  conducteur_nom: '',
  Numero_Piece: '',
  designation: '',
  poids: undefined,
  observations: '',
};

export default function RecusPerceptionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<RecuPerceptionCreate>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [taxes, setTaxes] = useState<Taxe[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    taxeService.list({ per_page: 100 }).then(async (res) => {
      setTaxes(res.data);
      if (isEdit && id) {
        try {
          const recu = await recuPerceptionService.get(Number(id));
          setForm({
            taxe_id: recu.taxe_id,
            type_perception: recu.type_perception,
            date_emission: recu.date_emission,
            heure_emission: recu.heure_emission || '',
            categorie_vehicule: recu.categorie_vehicule || '',
            plaque_immatriculation: recu.plaque_immatriculation || '',
            montant: recu.montant,
            trajet: recu.trajet || 'aller',
            chauffeur_nom: recu.chauffeur_nom || '',
            conducteur_nom: recu.conducteur_nom || '',
            Numero_Piece: recu.Numero_Piece || '',
            designation: recu.designation || '',
            poids: recu.poids ?? undefined,
            observations: recu.observations || '',
          });
        } catch {
          toast.error('Reçu non trouvé');
          navigate('/recus-perception');
        } finally {
          setLoadingData(false);
        }
      }
    }).catch(() => {});
  }, [id, isEdit, navigate]);

  const setField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const typeOptions = (Object.entries(typePerceptionLabels) as [TypePerception, string][]).map(([k, v]) => ({ label: v, value: k }));
  const taxeOptions = taxes.map(t => ({ label: t.nom, value: t.id }));
  const trajetOptions = [
    { label: 'Aller', value: 'aller' },
    { label: 'Retour', value: 'retour' },
    { label: 'Aller/Retour', value: 'aller_retour' },
  ];

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.taxe_id) { setErrors({ taxe_id: 'Taxe requise' }); return; }
    if (form.montant <= 0) { setErrors({ montant: 'Montant requis' }); return; }

    setSaving(true);
    try {
      if (isEdit && id) {
        await recuPerceptionService.update(Number(id), form);
        toast.success('Reçu modifié avec succès');
      } else {
        await recuPerceptionService.create(form);
        toast.success('Reçu créé avec succès');
      }
      navigate('/recus-perception');
    } catch (err: any) {
      if (err?.errors) setErrors(err.errors);
      else toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const isPeage = form.type_perception === 'peage_urbain';
  const isPontBascule = form.type_perception === 'pont_bascule';
  const isChargement = form.type_perception === 'chargement' || form.type_perception === 'dechargement';
  const isVehicule = isPeage || isPontBascule;

  if (loadingData) {
    return (
      <div className="space-y-6">
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/recus-perception')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Receipt className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Modifier le reçu' : 'Nouveau reçu de perception'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isEdit ? `Modification du reçu ${form.type_perception}` : 'Créer un reçu pour une taxe ponctuelle'}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>Accueil</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/recus-perception')}>Reçus perception</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900">{isEdit ? 'Modifier' : 'Nouveau'}</span>
        </nav>
      </div>

      {/* Formulaire */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations générales */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <FileText className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Informations générales</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Type de perception *"
                  options={typeOptions}
                  value={form.type_perception}
                  onChange={(e) => setField('type_perception', e.target.value)}
                />
                <Select
                  label="Taxe *"
                  options={taxeOptions}
                  value={form.taxe_id || ''}
                  onChange={(e) => {
                    const taxeId = Number(e.target.value);
                    const taxe = taxes.find(t => t.id === taxeId);
                    setForm(prev => ({ ...prev, taxe_id: taxeId, montant: taxe?.taux ?? prev.montant }));
                  }}
                  error={errors.taxe_id}
                />
                <Input
                  label="Montant (FC) *"
                  type="number"
                  value={form.montant || ''}
                  onChange={(e) => setField('montant', Number(e.target.value))}
                  error={errors.montant}
                />
                <Input
                  label="Désignation"
                  value={form.designation || ''}
                  onChange={(e) => setField('designation', e.target.value)}
                  placeholder="Ex: Sable, Gravier, Marchandise..."
                />
              </div>
            </div>
          </div>

          {/* Section: Date et heure */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Clock className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Date et heure</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date d'émission *"
                  type="date"
                  value={form.date_emission}
                  onChange={(e) => setField('date_emission', e.target.value)}
                />
                <Input
                  label="Heure"
                  type="time"
                  value={form.heure_emission || ''}
                  onChange={(e) => setField('heure_emission', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Véhicule */}
          {isVehicule && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <Car className="text-sm" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Véhicule</h3>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Catégorie véhicule"
                    value={form.categorie_vehicule || ''}
                    onChange={(e) => setField('categorie_vehicule', e.target.value)}
                    placeholder="Ex: Moto, Voiture, Camion"
                  />
                  <Input
                    label="N° Plaque"
                    value={form.plaque_immatriculation || ''}
                    onChange={(e) => setField('plaque_immatriculation', e.target.value)}
                    placeholder="Ex: ABC 123"
                  />
                  <Select
                    label="Trajet"
                    options={trajetOptions}
                    value={form.trajet || 'aller'}
                    onChange={(e) => setField('trajet', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Marchandise */}
          {isChargement && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <Truck className="text-sm" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Marchandise</h3>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Désignation"
                    value={form.designation || ''}
                    onChange={(e) => setField('designation', e.target.value)}
                    placeholder="Ex: Sable, Gravier..."
                  />
                  <Input
                    label="Poids (tonnes)"
                    type="number"
                    value={form.poids ?? ''}
                    onChange={(e) => setField('poids', e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <Input
                    label="N° Pièce"
                    value={form.Numero_Piece || ''}
                    onChange={(e) => setField('Numero_Piece', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Conducteur */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <MapPin className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">{isPeage ? 'Chauffeur' : 'Conducteur'}</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={isPeage ? 'Nom du chauffeur' : 'Nom du conducteur'}
                  value={isPeage ? (form.chauffeur_nom || '') : (form.conducteur_nom || '')}
                  onChange={(e) => isPeage ? setField('chauffeur_nom', e.target.value) : setField('conducteur_nom', e.target.value)}
                />
                {!isPeage && (
                  <Input
                    label="N° Pièce"
                    value={form.Numero_Piece || ''}
                    onChange={(e) => setField('Numero_Piece', e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section: Observations */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <FileText className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Observations</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <textarea
                value={form.observations || ''}
                onChange={(e) => setField('observations', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition resize-none"
                placeholder="Notes ou observations..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => navigate('/recus-perception')}>Annuler</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : <><Save size={16} /> {isEdit ? 'Modifier' : 'Créer le reçu'}</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
