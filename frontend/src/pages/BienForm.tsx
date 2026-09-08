import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Building, MapPin, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DropdownSearch from '../components/ui/DropdownSearch';
import { bienService } from '../services/bienService';
import { personneService } from '../services/personneService';
import { provinceService } from '../services/provinceService';
import { villeService } from '../services/villeService';
import { communeService } from '../services/communeService';
import { quartierService } from '../services/quartierService';
import type { BienImmobilier, Province, Ville, Commune, Quartier } from '../types';
import { FormSkeleton } from '../components/ui/Skeletons';

interface BienFormState {
  proprietaire_id: string | number;
  adresse: string;
  quartier: string;
  commune: string;
  parcelle_id: string;
  type_bien: string;
  superficie: string;
  valeur_locative: string;
  valeur_venale: string;
  classement: string;
}

const EMPTY_FORM: BienFormState = {
  proprietaire_id: '',
  adresse: '',
  quartier: '',
  commune: '',
  parcelle_id: '',
  type_bien: '',
  superficie: '',
  valeur_locative: '',
  valeur_venale: '',
  classement: '',
};

const typeBienOptions = [
  { label: 'Terrain', value: 'terrain' },
  { label: 'Maison', value: 'maison' },
  { label: 'Appartement', value: 'appartement' },
  { label: 'Immeuble', value: 'immeuble' },
  { label: 'Local commercial', value: 'local_commercial' },
  { label: 'Entrepôt', value: 'entrepot' },
  { label: 'Autre', value: 'autre' },
];

const classementOptions = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
];

export default function BienForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<BienFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [proprietaires, setProprietaires] = useState<{ label: string; value: number }[]>([]);
  const [loadingProprietaires, setLoadingProprietaires] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedVilleId, setSelectedVilleId] = useState<number | null>(null);
  const [selectedCommuneId, setSelectedCommuneId] = useState<number | null>(null);
  const [selectedQuartierId, setSelectedQuartierId] = useState<number | null>(null);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingVilles, setLoadingVilles] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [loadingQuartiers, setLoadingQuartiers] = useState(false);

  useEffect(() => {
    provinceService.list({ per_page: 100 }).then((res) => {
      setProvinces(res.data);
      setLoadingProvinces(false);
    }).catch(() => setLoadingProvinces(false));

    setLoadingProprietaires(true);
    personneService
      .list({ per_page: 100 })
      .then((res) => {
        setProprietaires(res.data.map((p) => ({
          label: p.nom_complet ?? `${p.nom} ${p.prenom ?? ''}`.trim(),
          value: p.id,
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingProprietaires(false));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      bienService
        .get(Number(id))
        .then(async (data: BienImmobilier) => {
          setForm({
            proprietaire_id: data.proprietaire_id,
            adresse: data.adresse ?? '',
            quartier: data.quartier ?? '',
            commune: data.commune ?? '',
            parcelle_id: data.parcelle_id ?? '',
            type_bien: data.type_bien,
            superficie: data.superficie != null ? String(data.superficie) : '',
            valeur_locative: data.valeur_locative != null ? String(data.valeur_locative) : '',
            valeur_venale: data.valeur_venale != null ? String(data.valeur_venale) : '',
            classement: data.classement != null ? String(data.classement) : '',
          });

          if (data.id_quartier) {
            try {
              const q = await quartierService.get(data.id_quartier);
              setSelectedQuartierId(q.id);
              setForm((prev) => ({ ...prev, quartier: q.nom }));

              if (q.commune_id) {
                const commune = await communeService.get(q.commune_id);
                setSelectedCommuneId(commune.id);
                setForm((prev) => ({ ...prev, commune: commune.nom }));

                if (commune.id_ville) {
                  const vs = await villeService.list({ per_page: 100, ...(commune.ville?.id_province != null ? { id_province: commune.ville.id_province } : {}) });
                  setVilles(vs.data);
                  const ville = vs.data.find((v) => v.id === commune.id_ville);
                  if (ville) {
                    setSelectedVilleId(ville.id);
                    setSelectedProvinceId(ville.id_province);
                    setForm((prev) => ({ ...prev, commune: commune.nom }));

                    if (ville.id_province) {
                      setLoadingProvinces(true);
                      const ps = await provinceService.list({ per_page: 100 });
                      setProvinces(ps.data);
                      setLoadingProvinces(false);

                      setLoadingCommunes(true);
                      const cs = await communeService.parVille(commune.id_ville);
                      setCommunes(cs);
                      setLoadingCommunes(false);

                      setLoadingQuartiers(true);
                      const qs = await quartierService.parCommune(commune.id);
                      setQuartiers(qs);
                      setLoadingQuartiers(false);
                    }
                  }
                }
              }
            } catch (e) {
              console.error('Erreur chargement cascade bien:', e);
            }
          }

          setLoading(false);
        })
        .catch(() => {
          toast.error('Erreur lors du chargement du bien');
          navigate('/biens');
        });
    }
  }, [id, isEdit, navigate]);

  const handleProvinceChange = async (value: string | number) => {
    const provinceId = value ? Number(value) : null;
    const province = provinces.find((p) => p.id === provinceId);
    setSelectedProvinceId(provinceId);
    setSelectedVilleId(null);
    setSelectedCommuneId(null);
    setSelectedQuartierId(null);
    setVilles([]);
    setCommunes([]);
    setQuartiers([]);
    setForm((prev) => ({ ...prev, commune: '', quartier: '' }));
    if (provinceId) {
      setLoadingVilles(true);
      try {
        const vs = await villeService.list({ per_page: 100, id_province: provinceId });
        setVilles(vs.data);
      } catch {}
      setLoadingVilles(false);
    }
  };

  const handleVilleChange = async (value: string | number) => {
    const villeId = value ? Number(value) : null;
    const ville = villes.find((v) => v.id === villeId);
    setSelectedVilleId(villeId);
    setSelectedCommuneId(null);
    setSelectedQuartierId(null);
    setCommunes([]);
    setQuartiers([]);
    setForm((prev) => ({ ...prev, commune: '', quartier: '' }));
    if (villeId) {
      setLoadingCommunes(true);
      try {
        const cs = await communeService.parVille(villeId);
        setCommunes(cs);
      } catch {}
      setLoadingCommunes(false);
    }
  };

  const handleCommuneChange = async (value: string | number) => {
    const communeId = value ? Number(value) : null;
    const commune = communes.find((c) => c.id === communeId);
    setSelectedCommuneId(communeId);
    setSelectedQuartierId(null);
    setQuartiers([]);
    setForm((prev) => ({ ...prev, commune: commune?.nom ?? '', quartier: '' }));
    if (communeId) {
      setLoadingQuartiers(true);
      try {
        const qs = await communeService.quartiers(communeId);
        setQuartiers(qs);
      } catch {}
      setLoadingQuartiers(false);
    }
  };

  const handleQuartierChange = (value: string | number) => {
    const qId = value ? Number(value) : null;
    const q = quartiers.find((q) => q.id === qId);
    setSelectedQuartierId(qId);
    setForm((prev) => ({ ...prev, quartier: q?.nom ?? '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.proprietaire_id) e.proprietaire_id = 'Le propriétaire est requis';
    if (!form.type_bien) e.type_bien = 'Le type de bien est requis';
    if (!form.adresse?.trim()) e.adresse = 'L\'adresse est requise';
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
        adresse: form.adresse || null,
        commune: form.commune || null,
        quartier: form.quartier || null,
        id_quartier: selectedQuartierId || null,
        parcelle_id: form.parcelle_id || null,
        type_bien: form.type_bien,
        superficie: form.superficie ? Number(form.superficie) : null,
        valeur_locative: form.valeur_locative ? Number(form.valeur_locative) : null,
        valeur_venale: form.valeur_venale ? Number(form.valeur_venale) : null,
        classement: form.classement ? Number(form.classement) : null,
      };

      if (isEdit && id) {
        await bienService.update(Number(id), payload);
        toast.success('Bien modifié');
      } else {
        await bienService.create(payload);
        toast.success('Bien créé');
      }
      navigate('/biens');
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

  const provinceOptions = provinces.map((p) => ({ label: p.nom, value: p.id }));
  const villeOptions = villes.map((v) => ({ label: v.nom, value: v.id }));
  const communeOptions = communes.map((c) => ({ label: c.nom, value: c.id }));
  const quartierOptions = quartiers.map((q) => ({ label: q.nom, value: q.id }));

  if (loading) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/biens')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Building className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Modifier le bien' : 'Nouveau bien'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isEdit ? `Modification du bien ${form.adresse ?? ''}` : 'Créer un nouveau bien immobilier'}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>Accueil</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/biens')}>Biens</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900">{isEdit ? 'Modifier' : 'Nouveau'}</span>
        </nav>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Propriétaire & Type */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Building className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Propriétaire et type</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
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
                <Select
                  label="Type de bien *"
                  options={typeBienOptions}
                  value={form.type_bien}
                  onChange={(e) => setField('type_bien', e.target.value)}
                  error={errors.type_bien}
                  placeholder="Sélectionner..."
                />
                <Select
                  label="Classement"
                  options={classementOptions}
                  value={form.classement}
                  onChange={(e) => setField('classement', e.target.value)}
                  error={errors.classement}
                  placeholder="Sélectionner..."
                />
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <MapPin className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Localisation</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Adresse *"
                  value={form.adresse}
                  onChange={(e) => setField('adresse', e.target.value)}
                  error={errors.adresse}
                  placeholder="Adresse complète"
                />
                <Input
                  label="Parcelle ID"
                  value={form.parcelle_id}
                  onChange={(e) => setField('parcelle_id', e.target.value)}
                  error={errors.parcelle_id}
                  placeholder="Ex: PAR-001-2024"
                />
                <DropdownSearch
                  label="Province"
                  options={provinceOptions}
                  value={selectedProvinceId ?? ''}
                  onChange={handleProvinceChange}
                  placeholder="Sélectionner une province..."
                  loading={loadingProvinces}
                />
                <DropdownSearch
                  label="Ville"
                  options={villeOptions}
                  value={selectedVilleId ?? ''}
                  onChange={handleVilleChange}
                  placeholder={selectedProvinceId ? 'Sélectionner une ville...' : 'Choisir une province d\'abord'}
                  loading={loadingVilles}
                />
                <DropdownSearch
                  label="Commune"
                  options={communeOptions}
                  value={selectedCommuneId ?? ''}
                  onChange={handleCommuneChange}
                  placeholder={selectedVilleId ? 'Sélectionner une commune...' : 'Choisir une ville d\'abord'}
                  loading={loadingCommunes}
                />
                <DropdownSearch
                  label="Quartier"
                  options={quartierOptions}
                  value={selectedQuartierId ?? ''}
                  onChange={handleQuartierChange}
                  placeholder={selectedCommuneId ? 'Sélectionner un quartier...' : 'Choisir une commune d\'abord'}
                  loading={loadingQuartiers}
                />
                <Input
                  label="Superficie (m²)"
                  type="number"
                  step="0.01"
                  value={form.superficie}
                  onChange={(e) => setField('superficie', e.target.value)}
                  error={errors.superficie}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Valeurs */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <DollarSign className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Valeurs</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Valeur locative"
                  type="number"
                  step="0.01"
                  value={form.valeur_locative}
                  onChange={(e) => setField('valeur_locative', e.target.value)}
                  error={errors.valeur_locative}
                  placeholder="0"
                />
                <Input
                  label="Valeur vénale"
                  type="number"
                  step="0.01"
                  value={form.valeur_venale}
                  onChange={(e) => setField('valeur_venale', e.target.value)}
                  error={errors.valeur_venale}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => navigate('/biens')}>Annuler</Button>
            <Button type="submit" loading={submitting} icon={<Save size={16} />}>{isEdit ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
