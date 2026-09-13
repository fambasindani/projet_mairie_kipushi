import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Key,
  Save,
  Camera,
  Calendar,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  Shield,
  CheckCircle,
  AtSign,
  Globe,
  Building2,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { post } from '../services/api';
import { formatDate } from '../utils/format';

interface PasswordForm {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

const EMPTY_PASSWORD: PasswordForm = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
};

export default function Profil() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const personne = user?.personne;
  const resolvedAvatarUrl = avatarUrl ?? personne?.avatar_url ?? null;

  const displayName =
    personne?.nom_complet ??
    [personne?.prenom, personne?.nom].filter(Boolean).join(' ') ??
    user?.nom_utilisateur ??
    '';
  const initials = personne
    ? ((personne.prenom?.[0] ?? '') + (personne.nom?.[0] ?? '')).toUpperCase() || '?'
    : (user?.nom_utilisateur?.[0] ?? '?').toUpperCase();

  const permissionsCount = new Set(
    user?.roles?.flatMap((r) => r.permissions?.map((p) => p.nom) ?? []) ?? []
  ).size;

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!passwordForm.current_password) e.current_password = 'Le mot de passe actuel est requis';
    if (!passwordForm.new_password) e.new_password = 'Le nouveau mot de passe est requis';
    if (passwordForm.new_password.length < 8) e.new_password = 'Minimum 8 caractères';
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      e.new_password_confirmation = 'Les mots de passe ne correspondent pas';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitPassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await authService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirmation: passwordForm.new_password_confirmation,
      });
      toast.success('Mot de passe modifié avec succès');
      setPasswordForm(EMPTY_PASSWORD);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, v]) => { fieldErrors[k] = v[0]; });
        setErrors(fieldErrors);
      } else {
        toast.error(apiErr.message || 'Erreur lors de la modification du mot de passe');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2 Mo');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await post<{ avatar: string }>('/profile/upload-avatar', formData);
      const reader = new FileReader();
      reader.onload = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
      toast.success('Photo de profil mise à jour');
    } catch {
      toast.error('Erreur lors de l\'upload de la photo');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarUpload(file);
    e.target.value = '';
  };

  const passwordHints = (() => {
    const len = passwordForm.new_password.length;
    if (len === 0) return { tone: 'slate', text: 'Choisissez un mot de passe fort d\'au moins 8 caractères.' };
    if (len < 8) return { tone: 'amber', text: `Encore ${8 - len} caractère(s) minimum.` };
    if (len < 12) return { tone: 'blue', text: 'Mot de passe acceptable.' };
    return { tone: 'emerald', text: 'Mot de passe fort.' };
  })();

  const hintTone: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-100 text-slate-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-xl shadow-indigo-500/20">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-white/30 bg-white/15 shadow-lg ring-4 ring-white/20 backdrop-blur-sm">
                {resolvedAvatarUrl ? (
                  <img
                    src={resolvedAvatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Changer la photo"
                className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white text-indigo-600 shadow-lg ring-4 ring-white/20 transition hover:bg-indigo-50 disabled:opacity-60"
              >
                {uploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Identity */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {displayName || user?.nom_utilisateur}
              </h1>
              <p className="mt-1.5 inline-flex items-center gap-2 text-sm text-white/70">
                <Mail size={14} /> {user?.email}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {user?.roles?.map((role) => (
                  <span
                    key={role.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                  >
                    <Shield size={12} /> {role.nom}
                  </span>
                ))}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${
                    user?.est_actif
                      ? 'border border-emerald-300/40 bg-emerald-400/20 text-emerald-50'
                      : 'border border-red-300/40 bg-red-400/20 text-red-50'
                  }`}
                >
                  <CheckCircle size={12} /> {user?.est_actif ? 'Compte actif' : 'Compte inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-6 lg:col-span-2">
          {/* Informations personnelles */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <User size={18} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Informations personnelles</h2>
                <p className="text-xs text-slate-400">Coordonnées et données d'identification</p>
              </div>
            </header>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
              <InfoField icon={<User size={16} />} label="Nom complet" value={displayName} />
              <InfoField icon={<AtSign size={16} />} label="Email" value={personne?.email ?? user?.email} />
              <InfoField icon={<Phone size={16} />} label="Téléphone" value={personne?.telephone} />
              <InfoField icon={<Phone size={16} />} label="Téléphone 2" value={personne?.telephone_2} />
              <InfoField icon={<CreditCard size={16} />} label="N° CNI" value={personne?.cni_numero} />
              <InfoField
                icon={<Calendar size={16} />}
                label="Date de naissance"
                value={personne?.date_naissance ? formatDate(personne.date_naissance) : null}
              />
              <InfoField icon={<MapPin size={16} />} label="Adresse" value={personne?.adresse} />
              <InfoField icon={<MapPin size={16} />} label="Commune" value={personne?.commune} />
              <InfoField icon={<Globe size={16} />} label="Nationalité" value={personne?.nationalite} />
              <InfoField
                icon={<Building2 size={16} />}
                label="Type d'opérateur"
                value={personne?.type === 'morale' ? 'Personne morale' : 'Personne physique'}
              />
            </div>
          </section>

          {/* Sécurité */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Key size={18} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Sécurité</h2>
                <p className="text-xs text-slate-400">Modifiez votre mot de passe de connexion</p>
              </div>
            </header>
            <form onSubmit={handleSubmitPassword} className="space-y-5 p-6">
              <div className={`flex items-center gap-3 rounded-xl border p-3 ${hintTone[passwordHints.tone]}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70">
                  <Shield size={14} />
                </span>
                <p className="text-xs font-medium">{passwordHints.text}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Mot de passe actuel *"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                    error={errors.current_password}
                    placeholder="••••••••"
                  />
                </div>
                <Input
                  label="Nouveau mot de passe *"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                  error={errors.new_password}
                  placeholder="Minimum 8 caractères"
                />
                <Input
                  label="Confirmer le mot de passe *"
                  type="password"
                  value={passwordForm.new_password_confirmation}
                  onChange={(e) => handlePasswordChange('new_password_confirmation', e.target.value)}
                  error={errors.new_password_confirmation}
                  placeholder="Confirmer le mot de passe"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => { setPasswordForm(EMPTY_PASSWORD); setErrors({}); }}
                >
                  Annuler
                </Button>
                <Button type="submit" loading={submitting} icon={<Save size={16} />}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </section>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <AtSign size={18} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Compte</h2>
                <p className="text-xs text-slate-400">Informations du compte</p>
              </div>
            </header>
            <div className="divide-y divide-slate-100 px-6 py-2">
              <AccountRow icon={<User size={15} />} label="Nom d'utilisateur" value={user?.nom_utilisateur || '—'} />
              <AccountRow icon={<Mail size={15} />} label="Email" value={user?.email || '—'} />
              <AccountRow
                icon={<Calendar size={15} />}
                label="Membre depuis"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              />
              <AccountRow
                icon={<Clock size={15} />}
                label="Dernière connexion"
                value={user?.derniere_connexion ? new Date(user.derniere_connexion).toLocaleDateString('fr-FR') : '—'}
              />
              <AccountRow
                icon={<CheckCircle size={15} />}
                label="Statut"
                value={user?.est_actif ? 'Actif' : 'Inactif'}
                valueClass={user?.est_actif ? 'text-emerald-600' : 'text-red-600'}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                <Shield size={18} />
              </span>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">{permissionsCount}</p>
                <p className="text-xs text-slate-400">permissions accordées</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {user?.roles?.map((role) => (
                <span key={role.id} className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {role.nom}
                </span>
              ))}
              {(!user?.roles || user.roles.length === 0) && (
                <span className="text-xs text-slate-400">Aucun rôle attribué</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">
          {value && value.length > 0 ? value : '—'}
        </p>
      </div>
    </div>
  );
}

function AccountRow({
  icon,
  label,
  value,
  valueClass = 'text-slate-800',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          {icon}
        </span>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <span className={`truncate text-right text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
