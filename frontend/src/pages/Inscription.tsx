import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Building, FileText, Lock, ArrowLeft, CheckCircle, MapPin } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DropdownSearch from '../components/ui/DropdownSearch';
import { post, get } from '../services/api';

interface FormState {
  type: string;
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;
  nationalite: string;
  adresse: string;
  email: string;
  telephone: string;
  denomination_sociale: string;
  forme_juridique: string;
  id_province: string;
  id_ville: string;
  id_commune: string;
  id_quartier: string;
  type_identifiant: string;
  valeur_identifiant: string;
  activite_id: string;
  date_debut_activite: string;
  mot_de_passe: string;
  mot_de_passe_confirmation: string;
}

const EMPTY_FORM: FormState = {
  type: 'physique',
  nom: '',
  prenom: '',
  sexe: '',
  date_naissance: '',
  lieu_naissance: '',
  nationalite: 'Congolaise',
  adresse: '',
  email: '',
  telephone: '',
  denomination_sociale: '',
  forme_juridique: '',
  id_province: '',
  id_ville: '',
  id_commune: '',
  id_quartier: '',
  type_identifiant: '',
  valeur_identifiant: '',
  activite_id: '',
  date_debut_activite: '',
  mot_de_passe: '',
  mot_de_passe_confirmation: '',
};

const typePersonneOptions = [
  { label: 'Personne physique', value: 'physique' },
  { label: 'Personne morale', value: 'morale' },
];

const sexeOptions = [
  { label: 'Masculin', value: 'M' },
  { label: 'Féminin', value: 'F' },
  { label: 'Autre', value: 'Autre' },
];

const identifiantOptions = [
  { label: 'RCCM', value: 'RCCM' },
  { label: 'ID NAT', value: 'IDNAT' },
  { label: 'Numéro d\'impôt', value: 'NUMERO_IMPOT' },
  { label: 'NIF', value: 'NIF' },
  { label: 'CNSS', value: 'CNSS' },
  { label: 'ONEM', value: 'ONEM' },
  { label: 'Passeport', value: 'PASSEPORT' },
  { label: 'Permis de conduire', value: 'PERMIS_CONDURE' },
];

export default function Inscription() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [activites, setActivites] = useState<{ label: string; value: number }[]>([]);
  const [provinces, setProvinces] = useState<{ label: string; value: number }[]>([]);
  const [villes, setVilles] = useState<{ label: string; value: number }[]>([]);
  const [communes, setCommunes] = useState<{ label: string; value: number }[]>([]);
  const [quartiers, setQuartiers] = useState<{ label: string; value: number }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingVilles, setLoadingVilles] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [loadingQuartiers, setLoadingQuartiers] = useState(false);

  useEffect(() => {
    Promise.all([
      get('/activites-economiques', { per_page: 200 }),
      get('/provinces', { per_page: 200 }),
    ]).then(([actRes, provRes]) => {
      const aData = (actRes as { data?: { id: number; nom: string }[] })?.data ?? [];
      const pData = (provRes as { data?: { id: number; nom: string }[] })?.data ?? [];
      setActivites(aData.map((a) => ({ label: a.nom, value: a.id })));
      setProvinces(pData.map((p) => ({ label: p.nom, value: p.id })));
    }).catch((err) => {
      console.error('Erreur chargement données inscription:', err);
    }).finally(() => setLoadingData(false));
  }, []);

  const fetchVilles = useCallback(async (provinceId: number) => {
    setLoadingVilles(true);
    try {
      const res = await get<{ data: { id: number; nom: string }[] }>('/villes', { id_province: provinceId, per_page: 200 });
      setVilles((res.data ?? []).map((v) => ({ label: v.nom, value: v.id })));
    } catch {
      setVilles([]);
    } finally {
      setLoadingVilles(false);
    }
  }, []);

  const fetchCommunes = useCallback(async (villeId: number) => {
    setLoadingCommunes(true);
    try {
      const res = await get<{ data: { id: number; nom: string }[] }>('/communes', { id_ville: villeId, per_page: 200 });
      setCommunes((res.data ?? []).map((c) => ({ label: c.nom, value: c.id })));
    } catch {
      setCommunes([]);
    } finally {
      setLoadingCommunes(false);
    }
  }, []);

  const fetchQuartiers = useCallback(async (communeId: number) => {
    setLoadingQuartiers(true);
    try {
      const res = await get<{ id: number; nom: string }[]>(`/communes/${communeId}/quartiers`);
      setQuartiers((Array.isArray(res) ? res : []).map((q) => ({ label: q.nom, value: q.id })));
    } catch {
      setQuartiers([]);
    } finally {
      setLoadingQuartiers(false);
    }
  }, []);

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));

    if (field === 'id_province') {
      setForm((prev) => ({ ...prev, id_province: value, id_ville: '', id_commune: '', id_quartier: '' }));
      setVilles([]);
      setCommunes([]);
      setQuartiers([]);
      if (value) fetchVilles(Number(value));
    } else if (field === 'id_ville') {
      setForm((prev) => ({ ...prev, id_ville: value, id_commune: '', id_quartier: '' }));
      setCommunes([]);
      setQuartiers([]);
      if (value) fetchCommunes(Number(value));
    } else if (field === 'id_commune') {
      setForm((prev) => ({ ...prev, id_commune: value, id_quartier: '' }));
      setQuartiers([]);
      if (value) fetchQuartiers(Number(value));
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.type) e.type = 'Le type de personne est requis';
    if (!form.nom.trim()) e.nom = 'Le nom est requis';
    if (form.type === 'physique') {
      if (!form.sexe) e.sexe = 'Le sexe est requis';
      if (!form.date_naissance) e.date_naissance = 'La date de naissance est requise';
    }
    if (!form.email.trim()) e.email = 'L\'email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.mot_de_passe) e.mot_de_passe = 'Le mot de passe est requis';
    else if (form.mot_de_passe.length < 8) e.mot_de_passe = 'Minimum 8 caractères';
    if (form.mot_de_passe !== form.mot_de_passe_confirmation) e.mot_de_passe_confirmation = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }
    setSubmitting(true);
    try {
      const res = await post<{ success?: boolean; message?: string }>('/inscription', {
        ...form,
        activite_id: form.activite_id || undefined,
        id_quartier: form.id_quartier || undefined,
        type_identifiant: form.type_identifiant || undefined,
        valeur_identifiant: form.valeur_identifiant || undefined,
      });
      toast.success(res?.message || 'Inscription soumise avec succès !');
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, v]) => { fieldErrors[k] = v[0]; });
        setErrors(fieldErrors);
        const messages = Object.values(apiErr.errors).flat().join('. ');
        toast.error(messages || 'Veuillez corriger les erreurs du formulaire');
      } else {
        toast.error(apiErr.message || 'Erreur lors de l\'inscription');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-5">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Inscription soumise !</h1>
          <p className="text-slate-500 mb-6">
            Votre demande d'inscription a été envoyée avec succès. Un administrateur va examiner votre dossier.
            Vous recevrez une confirmation une fois votre compte validé.
          </p>
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto p-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/login" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inscription opérateur</h1>
            <p className="text-sm text-slate-500">Créez votre compte pour déclarer vos taxes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identité */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <User className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Identité</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Type de personne *" options={typePersonneOptions} value={form.type} onChange={(e) => setField('type', e.target.value)} error={errors.type} />
              <Input label="Nom *" value={form.nom} onChange={(e) => setField('nom', e.target.value)} error={errors.nom} placeholder={form.type === 'morale' ? "Raison sociale" : "Votre nom"} />
              {form.type === 'physique' && (
                <>
                  <Select label="Sexe *" options={sexeOptions} value={form.sexe} onChange={(e) => setField('sexe', e.target.value)} error={errors.sexe} />
                  <Input label="Date de naissance *" type="date" value={form.date_naissance} onChange={(e) => setField('date_naissance', e.target.value)} error={errors.date_naissance} />
                </>
              )}
              {form.type === 'physique' && (
                <>
                  <Input label="Prénom" value={form.prenom} onChange={(e) => setField('prenom', e.target.value)} placeholder="Votre prénom" />
                  <Input label="Lieu de naissance" value={form.lieu_naissance} onChange={(e) => setField('lieu_naissance', e.target.value)} placeholder="Ville" />
                  <Input label="Nationalité" value={form.nationalite} onChange={(e) => setField('nationalite', e.target.value)} />
                </>
              )}
              {form.type === 'morale' && (
                <>
                  <Input label="Dénomination sociale" value={form.denomination_sociale} onChange={(e) => setField('denomination_sociale', e.target.value)} placeholder="Nom de l'entreprise" />
                  <Input label="Forme juridique" value={form.forme_juridique} onChange={(e) => setField('forme_juridique', e.target.value)} placeholder="SARL, SAS, ASBL..." />
                </>
              )}
            </div>
          </div>

          {/* Localisation */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <MapPin className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Localisation</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DropdownSearch
                label="Province"
                options={provinces}
                value={form.id_province}
                onChange={(v) => setField('id_province', String(v))}
                placeholder="Sélectionner une province..."
                loading={loadingData}
              />
              <DropdownSearch
                label="Ville"
                options={villes}
                value={form.id_ville}
                onChange={(v) => setField('id_ville', String(v))}
                placeholder={form.id_province ? 'Sélectionner une ville...' : 'Choisir d\'abord une province'}
                loading={loadingVilles}
              />
              <DropdownSearch
                label="Commune"
                options={communes}
                value={form.id_commune}
                onChange={(v) => setField('id_commune', String(v))}
                placeholder={form.id_ville ? 'Sélectionner une commune...' : 'Choisir d\'abord une ville'}
                loading={loadingCommunes}
              />
              <DropdownSearch
                label="Quartier"
                options={quartiers}
                value={form.id_quartier}
                onChange={(v) => setField('id_quartier', String(v))}
                placeholder={form.id_commune ? 'Sélectionner un quartier...' : 'Choisir d\'abord une commune'}
                loading={loadingQuartiers}
              />
            </div>
          </div>

          {/* Contact & Activité */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <FileText className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Contact & Activité</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email *" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} error={errors.email} placeholder="email@exemple.com" />
              <Input label="Téléphone" value={form.telephone} onChange={(e) => setField('telephone', e.target.value)} placeholder="+243..." />
              <Input label="Adresse" value={form.adresse} onChange={(e) => setField('adresse', e.target.value)} placeholder="Adresse complète" />
              <DropdownSearch label="Activité économique" options={activites} value={form.activite_id} onChange={(v) => setField('activite_id', String(v))} placeholder="Sélectionner..." loading={loadingData} />
              <Input label="Date début activité" type="date" value={form.date_debut_activite} onChange={(e) => setField('date_debut_activite', e.target.value)} />
            </div>
          </div>

          {/* Identifiant officiel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Building className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Identifiant officiel (optionnel)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Type" options={identifiantOptions} value={form.type_identifiant} onChange={(e) => setField('type_identifiant', e.target.value)} />
              <Input label="Numéro / Valeur" value={form.valeur_identifiant} onChange={(e) => setField('valeur_identifiant', e.target.value)} placeholder="Ex: 012345678" />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Lock className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Mot de passe</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Mot de passe *" type="password" value={form.mot_de_passe} onChange={(e) => setField('mot_de_passe', e.target.value)} error={errors.mot_de_passe} placeholder="Minimum 8 caractères" />
              <Input label="Confirmer *" type="password" value={form.mot_de_passe_confirmation} onChange={(e) => setField('mot_de_passe_confirmation', e.target.value)} error={errors.mot_de_passe_confirmation} placeholder="Retapez le mot de passe" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={submitting} className="px-8">
              Soumettre l'inscription
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
