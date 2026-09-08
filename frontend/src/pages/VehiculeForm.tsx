import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Car, MapPin, Gauge } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DropdownSearch from '../components/ui/DropdownSearch';
import { vehiculeService } from '../services/vehiculeService';
import { personneService } from '../services/personneService';
import type { Vehicule } from '../types';
import { FormSkeleton } from '../components/ui/Skeletons';

interface VehiculeFormState {
  proprietaire_id: string | number;
  plaque_immatriculation: string;
  marque: string;
  modele: string;
  annee_fabrication: string;
  couleur: string;
  type_vehicule: string;
  nombre_places: string;
  poids: string;
}

const EMPTY_FORM: VehiculeFormState = {
  proprietaire_id: '',
  plaque_immatriculation: '',
  marque: '',
  modele: '',
  annee_fabrication: '',
  couleur: '',
  type_vehicule: '',
  nombre_places: '',
  poids: '',
};

const typeVehiculeOptions = [
  { label: 'Voiture', value: 'voiture' },
  { label: 'Moto', value: 'moto' },
  { label: 'Poids lourd', value: 'poids_lourd' },
  { label: 'Bus', value: 'bus' },
  { label: 'Minibus', value: 'minibus' },
  { label: 'Taxi', value: 'taxi' },
  { label: 'Autre', value: 'autre' },
];

export default function VehiculeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<VehiculeFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [proprietaires, setProprietaires] = useState<{ label: string; value: number }[]>([]);
  const [loadingProprietaires, setLoadingProprietaires] = useState(false);

  useEffect(() => {
    setLoadingProprietaires(true);
    personneService
      .list({ per_page: 100 })
      .then((res) => {
        setProprietaires(res.data.map((p) => ({ label: `${p.nom} ${p.prenom ?? ''}`.trim(), value: p.id })));
      })
      .catch(() => {})
      .finally(() => setLoadingProprietaires(false));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      vehiculeService
        .get(Number(id))
        .then((data: Vehicule) => {
          setForm({
            proprietaire_id: data.proprietaire_id,
            plaque_immatriculation: data.plaque_immatriculation,
            marque: data.marque ?? '',
            modele: data.modele ?? '',
            annee_fabrication: data.annee_fabrication != null ? String(data.annee_fabrication) : '',
            couleur: data.couleur ?? '',
            type_vehicule: data.type_vehicule,
            nombre_places: data.nombre_places != null ? String(data.nombre_places) : '',
            poids: data.poids != null ? String(data.poids) : '',
          });
          setLoading(false);
        })
        .catch(() => {
          toast.error('Erreur lors du chargement du véhicule');
          navigate('/vehicules');
        });
    }
  }, [id, isEdit, navigate]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.proprietaire_id) e.proprietaire_id = 'Le propriétaire est requis';
    if (!form.plaque_immatriculation.trim()) e.plaque_immatriculation = "La plaque d'immatriculation est requise";
    if (!form.type_vehicule) e.type_vehicule = 'Le type de véhicule est requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        proprietaire_id: Number(form.proprietaire_id),
        plaque_immatriculation: form.plaque_immatriculation.toUpperCase(),
        marque: form.marque || null,
        modele: form.modele || null,
        annee_fabrication: form.annee_fabrication ? Number(form.annee_fabrication) : null,
        couleur: form.couleur || null,
        type_vehicule: form.type_vehicule,
        nombre_places: form.nombre_places ? Number(form.nombre_places) : null,
        poids: form.poids ? Number(form.poids) : null,
      };

      if (isEdit && id) {
        await vehiculeService.update(Number(id), payload);
        toast.success('Véhicule modifié');
      } else {
        await vehiculeService.create(payload);
        toast.success('Véhicule créé');
      }
      navigate('/vehicules');
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
          <button onClick={() => navigate('/vehicules')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Car className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isEdit ? `Modification du véhicule ${form.plaque_immatriculation}` : 'Créer un nouveau véhicule'}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>Accueil</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/vehicules')}>Véhicules</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900">{isEdit ? 'Modifier' : 'Nouveau'}</span>
        </nav>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <MapPin className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Propriétaire</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <DropdownSearch
                label="Propriétaire *"
                options={proprietaires}
                value={form.proprietaire_id}
                onChange={(val) => setField('proprietaire_id', val)}
                placeholder="Sélectionner un propriétaire..."
                loading={loadingProprietaires}
                error={errors.proprietaire_id}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Car className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Informations du véhicule</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Plaque d'immatriculation *"
                  value={form.plaque_immatriculation}
                  onChange={(e) => setField('plaque_immatriculation', e.target.value)}
                  error={errors.plaque_immatriculation}
                  placeholder="ABC 123"
                />
                <Select
                  label="Type de véhicule *"
                  options={typeVehiculeOptions}
                  value={form.type_vehicule}
                  onChange={(e) => setField('type_vehicule', e.target.value)}
                  error={errors.type_vehicule}
                  placeholder="Sélectionner..."
                />
                <Input
                  label="Marque"
                  value={form.marque}
                  onChange={(e) => setField('marque', e.target.value)}
                  error={errors.marque}
                  placeholder="Toyota, Honda..."
                />
                <Input
                  label="Modèle"
                  value={form.modele}
                  onChange={(e) => setField('modele', e.target.value)}
                  error={errors.modele}
                  placeholder="Corolla, Civic..."
                />
                <Input
                  label="Couleur"
                  value={form.couleur}
                  onChange={(e) => setField('couleur', e.target.value)}
                  error={errors.couleur}
                  placeholder="Rouge, Noir..."
                />
                <Input
                  label="Année de fabrication"
                  type="number"
                  min="1900"
                  max="2030"
                  value={form.annee_fabrication}
                  onChange={(e) => setField('annee_fabrication', e.target.value)}
                  error={errors.annee_fabrication}
                  placeholder="2024"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Gauge className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Spécifications</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre de places"
                  type="number"
                  min="1"
                  value={form.nombre_places}
                  onChange={(e) => setField('nombre_places', e.target.value)}
                  error={errors.nombre_places}
                  placeholder="5"
                />
                <Input
                  label="Poids (kg)"
                  type="number"
                  step="0.1"
                  value={form.poids}
                  onChange={(e) => setField('poids', e.target.value)}
                  error={errors.poids}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => navigate('/vehicules')}>Annuler</Button>
            <Button type="submit" loading={submitting} icon={<Save size={16} />}>{isEdit ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
