import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutDashboard, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "L'email est requis" }));
      return;
    }
    if (!motDePasse) {
      setErrors((prev) => ({ ...prev, password: 'Le mot de passe est requis' }));
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({
        email: email.trim(),
        password: motDePasse,
      });
      login(response.token, response.utilisateur);
      toast.success('Connexion réussie !');
      const isOperateur = response.utilisateur.roles?.some((r) => r.nom === 'Operateur');
      navigate(isOperateur ? '/profil' : '/');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
        if (err.errors) {
          setErrors({
            email: err.errors.email?.[0],
            password: err.errors.password?.[0],
          });
        }
      } else {
        toast.error('Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 px-4">
      <div className="w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
              <LayoutDashboard size={32} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Connexion</h1>
            <p className="text-sm text-gray-500 mt-1">Accédez à votre espace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="Entrez votre email"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
              autoFocus
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="Entrez votre mot de passe"
              icon={<Lock size={18} />}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Se connecter
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-white/70 mt-6">
          &copy; 2026 GS Opérateur
        </p>
      </div>
    </div>
  );
}
