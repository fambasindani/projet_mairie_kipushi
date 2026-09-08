import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, UserCog, User, Shield, CheckSquare, Square } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DropdownSearch from '../components/ui/DropdownSearch';
import { utilisateurService } from '../services/utilisateurService';
import { personneService } from '../services/personneService';
import { roleService } from '../services/roleService';
import type { Personne, Role, PaginatedResponse } from '../types';
import { FormSkeleton } from '../components/ui/Skeletons';

interface UserForm {
  nom_utilisateur: string;
  email: string;
  password: string;
  personne_id: number | null;
  role_ids: number[];
}

const EMPTY_FORM: UserForm = {
  nom_utilisateur: '',
  email: '',
  password: '',
  personne_id: null,
  role_ids: [],
};

export default function UtilisateurForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [personnesLoading, setPersonnesLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const fetchPersonnes = useCallback(async () => {
    setPersonnesLoading(true);
    try {
      const res = await personneService.list({ per_page: 500 });
      setPersonnes(res.data);
    } catch { /* silent */ } finally {
      setPersonnesLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res: PaginatedResponse<Role> = await roleService.list({ per_page: 100 });
      setRoles(res.data);
    } catch { /* silent */ } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonnes();
    fetchRoles();
  }, [fetchPersonnes, fetchRoles]);

  useEffect(() => {
    if (isEdit && id) {
      utilisateurService.get(Number(id)).then((data) => {
        setForm({
          nom_utilisateur: data.nom_utilisateur,
          email: data.email,
          password: '',
          personne_id: data.personne_id ?? null,
          role_ids: data.roles?.map((r) => r.id) ?? [],
        });
        setLoading(false);
      }).catch(() => {
        toast.error('Erreur lors du chargement de l\'utilisateur');
        navigate('/utilisateurs');
      });
    }
  }, [id, isEdit, navigate]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nom_utilisateur.trim()) e.nom_utilisateur = "Le nom d'utilisateur est requis";
    if (!form.email.trim()) e.email = "L'email est requis";
    if (!isEdit && !form.password.trim()) e.password = 'Le mot de passe est requis';
    if (form.password && form.password.length < 6) e.password = 'Minimum 6 caractères';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        nom_utilisateur: form.nom_utilisateur,
        email: form.email,
        personne_id: form.personne_id,
        role_ids: form.role_ids,
      };
      if (!isEdit) {
        payload.password = form.password;
      }
      if (isEdit && id) {
        await utilisateurService.update(Number(id), payload);
        toast.success('Utilisateur modifié');
      } else {
        await utilisateurService.create(payload);
        toast.success('Utilisateur créé');
      }
      navigate('/utilisateurs');
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

  const setField = (field: string, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleRole = (roleId: number) => {
    setForm((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((r) => r !== roleId)
        : [...prev.role_ids, roleId],
    }));
  };

  const selectAllRoles = () => setForm((p) => ({ ...p, role_ids: roles.map((r) => r.id) }));
  const deselectAllRoles = () => setForm((p) => ({ ...p, role_ids: [] }));

  const personneOptions = personnes.map((p) => ({
    label: `${p.nom} ${p.prenom ?? ''}`.trim(),
    value: p.id,
  }));

  if (loading) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/utilisateurs')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <UserCog className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isEdit ? `Modification de ${form.nom_utilisateur}` : 'Créer un nouvel utilisateur'}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>Accueil</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/utilisateurs')}>Utilisateurs</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900">{isEdit ? 'Modifier' : 'Nouveau'}</span>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Shield className="text-sm" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Informations du compte</h3>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nom d'utilisateur *" value={form.nom_utilisateur} onChange={(e) => setField('nom_utilisateur', e.target.value)} error={errors.nom_utilisateur} placeholder="nom.utilisateur" />
              <Input label="Email *" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} error={errors.email} placeholder="email@exemple.com" />
              {!isEdit && <Input label="Mot de passe *" type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} error={errors.password} placeholder="Minimum 6 caractères" />}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <User className="text-sm" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Personne associée</h3>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
            <DropdownSearch
              label="Personne associée"
              options={personneOptions}
              value={form.personne_id ?? ''}
              onChange={(val) => setField('personne_id', val === '' ? null : Number(val))}
              placeholder="Rechercher une personne..."
              loading={personnesLoading}
              error={errors.personne_id}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Shield className="text-sm" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rôles</h3>
                <p className="text-xs text-slate-400">{form.role_ids.length} sur {roles.length} sélectionnés</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={selectAllRoles} className="!py-1.5 !px-3 !text-xs">
                <CheckSquare size={14} className="mr-1" /> Tout cocher
              </Button>
              <Button type="button" variant="secondary" onClick={deselectAllRoles} className="!py-1.5 !px-3 !text-xs">
                <Square size={14} className="mr-1" /> Tout décocher
              </Button>
            </div>
          </div>
          <div className="mb-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300" style={{ width: `${roles.length > 0 ? (form.role_ids.length / roles.length) * 100 : 0}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => {
              const active = form.role_ids.includes(role.id);
              return (
                <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${active ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300 shadow-sm shadow-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                  {active ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span>{role.nom}</span>
                  {role.description && <span className="text-xs text-slate-400 ml-1 hidden sm:inline">— {role.description}</span>}
                </button>
              );
            })}
          </div>
          {errors.role_ids && <p className="mt-2 text-sm text-red-500">{errors.role_ids}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={() => navigate('/utilisateurs')}>Annuler</Button>
          <Button type="submit" loading={submitting} icon={<Save size={16} />}>{isEdit ? 'Modifier' : 'Créer'}</Button>
        </div>
      </form>
    </div>
  );
}
