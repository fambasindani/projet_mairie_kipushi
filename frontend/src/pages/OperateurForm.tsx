import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Users, User, Phone, MapPin, Briefcase, FileText, Plus, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DropdownSearch from '../components/ui/DropdownSearch';
import { personneService } from '../services/personneService';
import { provinceService } from '../services/provinceService';
import { villeService } from '../services/villeService';
import { communeService } from '../services/communeService';
import { quartierService } from '../services/quartierService';
import { activiteService } from '../services/activiteService';
import { identifiantService } from '../services/identifiantService';
import { post, get } from '../services/api';
import type { Personne, Province, Ville, Commune, Quartier, ActiviteEconomique, IdentifiantOfficiel } from '../types';
import { FormSkeleton } from '../components/ui/Skeletons';

interface SelectedActivite {
  id: number;
  nom: string;
  est_principale: boolean;
}

interface NewIdentifiant {
  type_identifiant: string;
  valeur: string;
  province_delivrance: string;
  date_delivrance: string;
  date_expiration: string;
}

const EMPTY_FORM: Partial<Personne> = {
  type: 'physique',
  nom: '',
  prenom: '',
  date_naissance: '',
  lieu_naissance: '',
  nationalite: '',
  sexe: 'M',
  telephone: '',
  telephone_2: '',
  email: '',
  adresse: '',
  quartier: '',
  commune: '',
  ville: '',
  province: '',
  denomination_sociale: '',
  forme_juridique: '',
  id_quartier: null,
  id_province: null,
  id_ville: null,
};

const typeOptions = [
  { label: 'Physique', value: 'physique' },
  { label: 'Morale', value: 'morale' },
];

const sexeOptions = [
  { label: 'Masculin', value: 'M' },
  { label: 'Féminin', value: 'F' },
];

export default function OperateurForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<Partial<Personne>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingVilles, setLoadingVilles] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [loadingQuartiers, setLoadingQuartiers] = useState(false);

  const [allActivites, setAllActivites] = useState<ActiviteEconomique[]>([]);
  const [selectedActivites, setSelectedActivites] = useState<SelectedActivite[]>([]);
  const [identifiants, setIdentifiants] = useState<IdentifiantOfficiel[]>([]);
  const [newIdentifiant, setNewIdentifiant] = useState<NewIdentifiant>({ type_identifiant: '', valeur: '', province_delivrance: '', date_delivrance: '', date_expiration: '' });
  const [savingIdentifiant, setSavingIdentifiant] = useState(false);
  const [identifiantTypes, setIdentifiantTypes] = useState<Record<string, string>>({});

  useEffect(() => {
    provinceService.list({ per_page: 100 }).then((res) => {
      setProvinces(res.data);
      setLoadingProvinces(false);
    });
    activiteService.list({ per_page: 200 }).then((res) => setAllActivites(res.data)).catch(() => {});
    identifiantService.types().then((res) => setIdentifiantTypes(res)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      personneService.get(Number(id)).then((data) => {
        setForm({
          type: data.type,
          nom: data.nom,
          prenom: data.prenom ?? '',
          date_naissance: data.date_naissance ?? '',
          lieu_naissance: data.lieu_naissance ?? '',
          nationalite: data.nationalite ?? '',
          sexe: data.sexe ?? 'M',
          telephone: data.telephone ?? '',
          telephone_2: data.telephone_2 ?? '',
          email: data.email ?? '',
          adresse: data.adresse ?? '',
          quartier: data.quartier ?? '',
          commune: data.commune ?? '',
          ville: data.ville ?? '',
          province: data.province ?? '',
          denomination_sociale: data.denomination_sociale ?? '',
          forme_juridique: data.forme_juridique ?? '',
          id_quartier: data.id_quartier ?? null,
          id_province: data.id_province ?? null,
          id_ville: data.id_ville ?? null,
        });

        const loadCascade = async () => {
          if (data.id_ville) {
            setLoadingVilles(true);
            const vs = await villeService.list({ per_page: 100, ...(data.id_province ? { id_province: data.id_province } : {}) });
            setVilles(vs.data);
            setLoadingVilles(false);
          }
          if (data.id_ville) {
            setLoadingCommunes(true);
            const cs = await communeService.parVille(data.id_ville);
            setCommunes(cs);
            setLoadingCommunes(false);
          }
          if (data.id_quartier) {
            setLoadingQuartiers(true);
            const q = await quartierService.get(data.id_quartier);
            if (q.commune_id) {
              const qs = await communeService.quartiers(q.commune_id);
              setQuartiers(qs);
            }
            setLoadingQuartiers(false);
          }
        };
        loadCascade();

        get<{ data: ActiviteEconomique[] }>(`/operateur-activites/${id}`).then((res) => {
          setSelectedActivites(res.data.map((a) => ({ id: a.id, nom: a.nom, est_principale: (a as unknown as Record<string, unknown>).est_principale as boolean ?? false })));
        }).catch(() => {});

        identifiantService.list({ personne_id: Number(id), per_page: 100 }).then((res) => {
          setIdentifiants(res.data);
        }).catch(() => {});

        setLoading(false);
      }).catch(() => {
        toast.error('Erreur lors du chargement de l\'opérateur');
        navigate('/operateurs');
      });
    }
  }, [id, isEdit, navigate]);

  const handleProvinceChange = async (value: string | number) => {
    const provinceId = value ? Number(value) : null;
    const province = provinces.find((p) => p.id === provinceId);
    setForm((prev) => ({
      ...prev,
      id_province: provinceId,
      province: province?.nom ?? '',
      id_ville: null,
      ville: '',
      id_quartier: null,
      commune: '',
      quartier: '',
    }));
    setVilles([]);
    setCommunes([]);
    setQuartiers([]);
    if (provinceId) {
      setLoadingVilles(true);
      const vs = await villeService.list({ per_page: 100, id_province: provinceId });
      setVilles(vs.data);
      setLoadingVilles(false);
    }
  };

  const handleVilleChange = async (value: string | number) => {
    const villeId = value ? Number(value) : null;
    const ville = villes.find((v) => v.id === villeId);
    setForm((prev) => ({
      ...prev,
      id_ville: villeId,
      ville: ville?.nom ?? '',
      id_quartier: null,
      commune: '',
      quartier: '',
    }));
    setCommunes([]);
    setQuartiers([]);
    if (villeId) {
      setLoadingCommunes(true);
      const cs = await communeService.parVille(villeId);
      setCommunes(cs);
      setLoadingCommunes(false);
    }
  };

  const handleCommuneChange = async (value: string | number) => {
    const communeId = value ? Number(value) : null;
    const commune = communes.find((c) => c.id === communeId);
    setForm((prev) => ({
      ...prev,
      commune: commune?.nom ?? '',
      id_quartier: null,
      quartier: '',
    }));
    setQuartiers([]);
    if (communeId) {
      setLoadingQuartiers(true);
      const qs = await communeService.quartiers(communeId);
      setQuartiers(qs);
      setLoadingQuartiers(false);
    }
  };

  const handleQuartierChange = (value: string | number) => {
    const qId = value ? Number(value) : null;
    const q = quartiers.find((q) => q.id === qId);
    setForm((prev) => ({
      ...prev,
      id_quartier: qId,
      quartier: q?.nom ?? '',
    }));
  };

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const provinceOptions = provinces.map((p) => ({ label: p.nom, value: p.id }));
  const villeOptions = villes.map((v) => ({ label: v.nom, value: v.id }));
  const communeOptions = communes.map((c) => ({ label: c.nom, value: c.id }));
  const quartierOptions = quartiers.map((q) => ({ label: q.nom, value: q.id }));

  const toggleActivite = (activite: ActiviteEconomique) => {
    setSelectedActivites((prev) => {
      const exists = prev.find((a) => a.id === activite.id);
      if (exists) return prev.filter((a) => a.id !== activite.id);
      return [...prev, { id: activite.id, nom: activite.nom, est_principale: false }];
    });
  };

  const handleAddIdentifiant = async () => {
    if (!newIdentifiant.type_identifiant || !newIdentifiant.valeur.trim()) {
      toast.error('Type et valeur sont requis');
      return;
    }
    setSavingIdentifiant(true);
    try {
      const res = await identifiantService.create({
        personne_id: Number(id),
        type_identifiant: newIdentifiant.type_identifiant as IdentifiantOfficiel['type_identifiant'],
        valeur: newIdentifiant.valeur,
        province_delivrance: newIdentifiant.province_delivrance || undefined,
        date_delivrance: newIdentifiant.date_delivrance || undefined,
        date_expiration: newIdentifiant.date_expiration || undefined,
      });
      setIdentifiants((prev) => [...prev, res]);
      setNewIdentifiant({ type_identifiant: '', valeur: '', province_delivrance: '', date_delivrance: '', date_expiration: '' });
      toast.success('Identifiant ajouté');
    } catch {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setSavingIdentifiant(false);
    }
  };

  const handleDeleteIdentifiant = async (identId: number) => {
    try {
      await identifiantService.delete(identId);
      setIdentifiants((prev) => prev.filter((i) => i.id !== identId));
      toast.success('Identifiant supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const identifiantTypeOptions = Object.entries(identifiantTypes).map(([value, label]) => ({ label, value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nom?.trim()) e.nom = 'Le nom est requis';
    if (!form.type) e.type = 'Le type est requis';
    if (form.type === 'physique' && !form.prenom?.trim()) e.prenom = 'Le prénom est requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          payload[k] = v;
        }
      });

      let personId: number;
      if (isEdit && id) {
        await personneService.update(Number(id), payload);
        personId = Number(id);
        toast.success('Opérateur modifié');
      } else {
        const created = await personneService.create(payload);
        personId = created.id;
        toast.success('Opérateur créé');
      }

      if (selectedActivites.length > 0) {
        await post('/operateur-activites/assigner', {
          personne_id: personId,
          activites: selectedActivites.map((a) => ({ id: a.id, est_principale: a.est_principale })),
        }).catch(() => {});
      }

      navigate('/operateurs');
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

  if (loading) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/operateurs')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Users className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Modifier l\'opérateur' : 'Nouvel opérateur'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isEdit ? `Modification de ${form.nom} ${form.prenom ?? ''}`.trim() : 'Créer un nouvel opérateur'}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>Accueil</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/operateurs')}>Opérateurs</span>
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
              <h3 className="text-sm font-bold text-slate-900">Informations générales</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Type *"
                  options={typeOptions}
                  value={form.type ?? ''}
                  onChange={(e) => setField('type', e.target.value)}
                  error={errors.type}
                />
                {form.type === 'physique' ? (
                  <>
                    <Input
                      label="Nom *"
                      value={form.nom ?? ''}
                      onChange={(e) => setField('nom', e.target.value)}
                      error={errors.nom}
                      placeholder="Nom de famille"
                    />
                    <Input
                      label="Prénom *"
                      value={form.prenom ?? ''}
                      onChange={(e) => setField('prenom', e.target.value)}
                      error={errors.prenom}
                      placeholder="Prénom"
                    />
                    <Input
                      label="Date de naissance"
                      type="date"
                      value={form.date_naissance ?? ''}
                      onChange={(e) => setField('date_naissance', e.target.value)}
                      error={errors.date_naissance}
                    />
                    <Input
                      label="Lieu de naissance"
                      value={form.lieu_naissance ?? ''}
                      onChange={(e) => setField('lieu_naissance', e.target.value)}
                      error={errors.lieu_naissance}
                    />
                    <Input
                      label="Nationalité"
                      value={form.nationalite ?? ''}
                      onChange={(e) => setField('nationalite', e.target.value)}
                      error={errors.nationalite}
                    />
                    <Select
                      label="Sexe"
                      options={sexeOptions}
                      value={form.sexe ?? 'M'}
                      onChange={(e) => setField('sexe', e.target.value)}
                      error={errors.sexe}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Nom *"
                      value={form.nom ?? ''}
                      onChange={(e) => setField('nom', e.target.value)}
                      error={errors.nom}
                      placeholder="Raison sociale"
                    />
                    <Input
                      label="Dénomination sociale"
                      value={form.denomination_sociale ?? ''}
                      onChange={(e) => setField('denomination_sociale', e.target.value)}
                      error={errors.denomination_sociale}
                    />
                    <Input
                      label="Forme juridique"
                      value={form.forme_juridique ?? ''}
                      onChange={(e) => setField('forme_juridique', e.target.value)}
                      error={errors.forme_juridique}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <MapPin className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Coordonnées</h3>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Téléphone"
                  value={form.telephone ?? ''}
                  onChange={(e) => setField('telephone', e.target.value)}
                  error={errors.telephone}
                />
                <Input
                  label="Téléphone 2"
                  value={form.telephone_2 ?? ''}
                  onChange={(e) => setField('telephone_2', e.target.value)}
                  error={errors.telephone_2}
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setField('email', e.target.value)}
                  error={errors.email}
                />
                <Input
                  label="Adresse"
                  value={form.adresse ?? ''}
                  onChange={(e) => setField('adresse', e.target.value)}
                  error={errors.adresse}
                />
                <DropdownSearch
                  label="Province"
                  options={provinceOptions}
                  value={form.id_province ?? ''}
                  onChange={handleProvinceChange}
                  placeholder="Sélectionner une province..."
                  loading={loadingProvinces}
                />
                <DropdownSearch
                  label="Ville"
                  options={villeOptions}
                  value={form.id_ville ?? ''}
                  onChange={handleVilleChange}
                  placeholder={form.id_province ? 'Sélectionner une ville...' : 'Choisir une province d\'abord'}
                  loading={loadingVilles}
                />
                <DropdownSearch
                  label="Commune"
                  options={communeOptions}
                  value={communes.find((c) => c.nom === form.commune)?.id ?? ''}
                  onChange={handleCommuneChange}
                  placeholder={form.id_ville ? 'Sélectionner une commune...' : 'Choisir une ville d\'abord'}
                  loading={loadingCommunes}
                />
                <DropdownSearch
                  label="Quartier"
                  options={quartierOptions}
                  value={form.id_quartier ?? ''}
                  onChange={handleQuartierChange}
                  placeholder={communes.length > 0 ? 'Sélectionner un quartier...' : 'Choisir une commune d\'abord'}
                  loading={loadingQuartiers}
                />
              </div>
            </div>
          </div>

          {isEdit && (
            <>
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                    <Briefcase className="text-sm" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Activités économiques</h3>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                  {selectedActivites.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedActivites.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-medium">
                          {a.nom}
                          <button type="button" onClick={() => toggleActivite(a as unknown as ActiviteEconomique)} className="ml-1 hover:text-indigo-900 cursor-pointer">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {allActivites.map((a) => {
                      const selected = selectedActivites.some((s) => s.id === a.id);
                      return (
                        <button key={a.id} type="button" onClick={() => toggleActivite(a)}
                          className={`text-left p-3 rounded-xl border text-sm transition-all cursor-pointer ${selected ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                          {a.nom}
                          {a.secteur && <span className="block text-xs text-slate-400 mt-0.5">{a.secteur}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {allActivites.length === 0 && <p className="text-sm text-slate-400">Aucune activité disponible</p>}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                    <FileText className="text-sm" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Identifiants officiels</h3>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
                  {identifiants.length > 0 && (
                    <div className="space-y-2">
                      {identifiants.map((ident) => (
                        <div key={ident.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                          <div>
                            <span className="text-sm font-semibold text-slate-700">{ident.type_identifiant}</span>
                            <span className="mx-2 text-slate-300">—</span>
                            <span className="text-sm text-slate-600">{ident.valeur}</span>
                          </div>
                          <button type="button" onClick={() => handleDeleteIdentifiant(ident.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-xl border border-dashed border-slate-300 bg-white">
                    <Select label="Type *" options={identifiantTypeOptions} value={newIdentifiant.type_identifiant} onChange={(e) => setNewIdentifiant((p) => ({ ...p, type_identifiant: e.target.value }))} />
                    <Input label="Valeur *" value={newIdentifiant.valeur} onChange={(e) => setNewIdentifiant((p) => ({ ...p, valeur: e.target.value }))} placeholder="Numéro..." />
                    <Input label="Province de délivrance" value={newIdentifiant.province_delivrance} onChange={(e) => setNewIdentifiant((p) => ({ ...p, province_delivrance: e.target.value }))} />
                    <Input label="Date de délivrance" type="date" value={newIdentifiant.date_delivrance} onChange={(e) => setNewIdentifiant((p) => ({ ...p, date_delivrance: e.target.value }))} />
                    <Input label="Date d'expiration" type="date" value={newIdentifiant.date_expiration} onChange={(e) => setNewIdentifiant((p) => ({ ...p, date_expiration: e.target.value }))} />
                    <div className="flex items-end">
                      <Button type="button" variant="secondary" icon={<Plus size={14} />} onClick={handleAddIdentifiant} loading={savingIdentifiant} className="!w-full">Ajouter</Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => navigate('/operateurs')}>Annuler</Button>
            <Button type="submit" loading={submitting} icon={<Save size={16} />}>{isEdit ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
