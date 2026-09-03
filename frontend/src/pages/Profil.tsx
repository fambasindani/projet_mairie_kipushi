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
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { post } from '../services/api';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (user?.personne?.avatar) {
      return user.personne.avatar.startsWith('http') ? user.personne.avatar : `http://localhost:8000/storage/${user.personne.avatar}`;
    }
    return null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const personne = user?.personne;
  const displayName = personne?.nom_complet ?? [personne?.prenom, personne?.nom].filter(Boolean).join(' ') ?? user?.nom_utilisateur ?? '';
  const initials = personne
    ? ((personne.prenom?.[0] ?? '') + (personne.nom?.[0] ?? '')).toUpperCase() || '?'
    : (user?.nom_utilisateur?.[0] ?? '?').toUpperCase();

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!passwordForm.current_password) e.current_password = 'Le mot de passe actuel est requis';
    if (!passwordForm.new_password) e.new_password = 'Le nouveau mot de passe est requis';
    if (passwordForm.new_password.length < 8) e.new_password = 'Minimum 8 caractères';
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) e.new_password_confirmation = 'Les mots de passe ne correspondent pas';
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
      const res = await post<{ avatar: string }>('/profile/upload-avatar', formData);
      setAvatarUrl(res.avatar);
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

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-white shadow-xl shadow-indigo-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzRtMC0ydjJIMnYtMmgzNG0wLTJ2Mkg0VjRoMnYyem0tMiAxNHYySDJ2LTJoMzRtMC0ydjJIMnYtMmgzNG0wLTJ2Mkg0VjE0aDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="relative flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-2 border-white/30 overflow-hidden shadow-lg">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center shadow-lg hover:bg-indigo-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{displayName || user?.nom_utilisateur}</h1>
            <p className="text-white/70 mt-1">{user?.email}</p>
            <div className="flex items-center gap-3 mt-3">
              {user?.roles?.map((role) => (
                <span key={role.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/20 backdrop-blur-sm">
                  {role.nom}
                </span>
              ))}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user?.est_actif ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/30' : 'bg-red-500/30 text-red-100 border border-red-400/30'}`}>
                {user?.est_actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Informations du compte</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <User size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Nom d'utilisateur</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.nom_utilisateur}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Mail size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.email}</p>
                </div>
              </div>
              {personne?.telephone && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Phone size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Téléphone</p>
                    <p className="text-sm font-semibold text-slate-900">{personne.telephone}</p>
                  </div>
                </div>
              )}
              {personne?.adresse && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <MapPin size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Adresse</p>
                    <p className="text-sm font-semibold text-slate-900">{personne.adresse}</p>
                  </div>
                </div>
              )}
              {personne?.cni_numero && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <CreditCard size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">N° CNI</p>
                    <p className="text-sm font-semibold text-slate-900">{personne.cni_numero}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Calendar size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Membre depuis</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
              {user?.derniere_connexion && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Clock size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Dernière connexion</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(user.derniere_connexion).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Password */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            {/* Password Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Key size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Changer le mot de passe</h3>
                  <p className="text-xs text-white/70 mt-0.5">Sécurisez votre compte avec un nouveau mot de passe</p>
                </div>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleSubmitPassword} className="p-6 space-y-5">
              {/* Strength indicator visual */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Key size={14} className="text-amber-600" />
                </div>
                <p className="text-xs text-amber-700">
                  {passwordForm.new_password.length === 0 && 'Choisissez un mot de passe fort d\'au moins 8 caractères.'}
                  {passwordForm.new_password.length > 0 && passwordForm.new_password.length < 8 && `Encore ${8 - passwordForm.new_password.length} caractère(s) minimum.`}
                  {passwordForm.new_password.length >= 8 && passwordForm.new_password.length < 12 && 'Mot de passe acceptable.'}
                  {passwordForm.new_password.length >= 12 && 'Mot de passe fort.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Mot de passe actuel *"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                    error={errors.current_password}
                    placeholder="••••••••"
                  />
                </div>
                <div className="relative">
                  <Input
                    label="Nouveau mot de passe *"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                    error={errors.new_password}
                    placeholder="Minimum 8 caractères"
                  />
                </div>
                <div className="relative">
                  <Input
                    label="Confirmer le mot de passe *"
                    type="password"
                    value={passwordForm.new_password_confirmation}
                    onChange={(e) => handlePasswordChange('new_password_confirmation', e.target.value)}
                    error={errors.new_password_confirmation}
                    placeholder="Confirmer le mot de passe"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => { setPasswordForm(EMPTY_PASSWORD); setErrors({}); }}
                >
                  Annuler
                </Button>
                <Button type="submit" loading={submitting} icon={<Save size={16} />}>
                  Modifier le mot de passe
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
