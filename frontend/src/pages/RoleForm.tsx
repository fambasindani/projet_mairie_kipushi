import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Shield, Key, CheckSquare, Square, Eye, Plus, Pencil, Trash2, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { roleService } from '../services/roleService';
import { permissionService } from '../services/permissionService';
import type { Permission } from '../types';
import { FormSkeleton } from '../components/ui/Skeletons';

const SYSTEM_ROLES = ['Administrateur', 'Operateur'];

export default function RoleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [isSystemRole, setIsSystemRole] = useState(false);

  useEffect(() => {
    permissionService.all().then((data) => setPermissions(data)).catch(() => {});
    if (isEdit && id) {
      roleService.get(Number(id)).then((role) => {
        setNom(role.nom);
        setDescription(role.description ?? '');
        setSelectedPerms(role.permissions?.map((p) => p.id) ?? []);
        setIsSystemRole(SYSTEM_ROLES.includes(role.nom));
        setLoading(false);
      }).catch(() => {
        toast.error('Rôle non trouvé');
        navigate('/roles');
      });
    }
  }, [id, isEdit, navigate]);

  const permByRessource = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.ressource] = acc[p.ressource] || []).push(p);
    return acc;
  }, {});

  const togglePerm = (id: number) => {
    setSelectedPerms((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const ressourceKeys = Object.keys(permByRessource).sort();

  const selectAll = () => setSelectedPerms(permissions.map((p) => p.id));
  const deselectAll = () => setSelectedPerms([]);

  const selectRessource = (ressource: string) => {
    const ids = permByRessource[ressource].map((p) => p.id);
    setSelectedPerms((prev) => [...new Set([...prev, ...ids])]);
  };

  const deselectRessource = (ressource: string) => {
    const ids = new Set(permByRessource[ressource].map((p) => p.id));
    setSelectedPerms((prev) => prev.filter((x) => !ids.has(x)));
  };

  const ressourceSelected = (ressource: string) => permByRessource[ressource].every((p) => selectedPerms.includes(p.id));
  const ressourcePartial = (ressource: string) => {
    const cnt = permByRessource[ressource].filter((p) => selectedPerms.includes(p.id)).length;
    return cnt > 0 && cnt < permByRessource[ressource].length;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!nom.trim()) e.nom = 'Le nom est requis';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const payload = { nom, description: description || undefined, permissions: selectedPerms };
      if (isEdit && id) {
        await roleService.update(Number(id), payload);
        toast.success('Rôle modifié');
      } else {
        await roleService.create(payload);
        toast.success('Rôle créé');
      }
      navigate('/roles');
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, v]) => { fieldErrors[k] = v[0]; });
        setErrors(fieldErrors);
      } else {
        toast.error(apiErr.message || 'Erreur');
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
          <button onClick={() => navigate('/roles')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Shield className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Modifier le rôle' : 'Nouveau rôle'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isEdit ? `Modification de ${nom}` : 'Créer un nouveau rôle'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isSystemRole && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Rôle système — lecture seule</p>
              <p className="text-xs text-amber-600">Ce rôle est protégé et ne peut pas être modifié ni supprimé.</p>
            </div>
          </div>
        )}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Shield className="text-sm" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Informations du rôle</h3>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nom *" value={nom} onChange={(e) => { setNom(e.target.value); if (errors.nom) setErrors((p) => ({ ...p, nom: '' })); }} error={errors.nom} placeholder="Ex: Administrateur" disabled={isSystemRole} />
              <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} placeholder="Description du rôle..." disabled={isSystemRole} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Key className="text-sm" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Permissions</h3>
                <p className="text-xs text-slate-400">{selectedPerms.length} sur {permissions.length} sélectionnées</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isSystemRole && (
                <>
                  <Button type="button" variant="secondary" onClick={selectAll} className="!py-1.5 !px-3 !text-xs">
                    <CheckSquare size={14} className="mr-1" /> Tout cocher
                  </Button>
                  <Button type="button" variant="secondary" onClick={deselectAll} className="!py-1.5 !px-3 !text-xs">
                    <Square size={14} className="mr-1" /> Tout décocher
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mb-5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
              style={{ width: `${permissions.length > 0 ? (selectedPerms.length / permissions.length) * 100 : 0}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ressourceKeys.map((ressource) => {
              const all = ressourceSelected(ressource);
              const partial = ressourcePartial(ressource);
              const count = permByRessource[ressource].filter((p) => selectedPerms.includes(p.id)).length;
              const total = permByRessource[ressource].length;
              const icons: Record<string, string> = {
                operateur: '👥', taxe: '💰', paiement: '💳', facture: '🧾',
                patrimoine: '🏛️', vehicule: '🚗', permis: '📋', notification: '🔔',
                audit: '🔍', dashboard: '📊', activite: '💼', auth: '🔑',
              };
              const icon = icons[ressource] || '📁';

              return (
                <div key={ressource} className={`rounded-xl border transition-all duration-200 ${all ? 'border-indigo-200 bg-indigo-50/30' : partial ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100 bg-slate-50/30 hover:border-slate-200'}`}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/80">
                    <div className="flex items-center gap-2.5">
                      <button type="button" onClick={() => all ? deselectRessource(ressource) : selectRessource(ressource)} disabled={isSystemRole}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${isSystemRole ? 'opacity-50 cursor-not-allowed' : ''} ${all ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200' : partial ? 'bg-indigo-200 border-indigo-400 text-indigo-700' : 'border-slate-300 bg-white hover:border-indigo-400'}`}>
                        {all ? <CheckSquare size={13} /> : partial ? <div className="w-2 h-0.5 bg-indigo-600 rounded" /> : null}
                      </button>
                      <span className="text-lg leading-none">{icon}</span>
                      <span className="text-sm font-semibold text-slate-700 capitalize">{ressource}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count === total ? 'bg-indigo-100 text-indigo-700' : count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                      {count}/{total}
                    </span>
                  </div>
                  <div className="p-3 flex flex-wrap gap-1.5">
                    {permByRessource[ressource].map((p) => {
                      const active = selectedPerms.includes(p.id);
                      const actionColors: Record<string, { active: string; inactive: string }> = {
                        create: { active: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 shadow-sm shadow-emerald-100', inactive: 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600' },
                        read: { active: 'bg-sky-100 text-sky-700 ring-1 ring-sky-300 shadow-sm shadow-sky-100', inactive: 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-sky-300 hover:text-sky-600' },
                        update: { active: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300 shadow-sm shadow-amber-100', inactive: 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-amber-300 hover:text-amber-600' },
                        delete: { active: 'bg-red-100 text-red-700 ring-1 ring-red-300 shadow-sm shadow-red-100', inactive: 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-red-300 hover:text-red-600' },
                      };
                      const actionIcons: Record<string, React.ReactNode> = {
                        create: <Plus size={12} />,
                        read: <Eye size={12} />,
                        update: <Pencil size={12} />,
                        delete: <Trash2 size={12} />,
                      };
                      const colors = actionColors[p.action] || (active ? actionColors.create : actionColors.create.inactive);
                      return (
                        <button key={p.id} type="button" onClick={() => togglePerm(p.id)} disabled={isSystemRole}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${isSystemRole ? 'opacity-50 cursor-not-allowed' : ''} ${active ? colors.active : colors.inactive}`}>
                          {actionIcons[p.action] || null}
                          {p.action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={() => navigate('/roles')}>Retour</Button>
          {!isSystemRole && <Button type="submit" loading={submitting} icon={<Save size={16} />}>{isEdit ? 'Modifier' : 'Créer'}</Button>}
        </div>
      </form>
    </div>
  );
}
