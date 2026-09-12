import { Link } from 'react-router-dom';
import { Building2, FileText, Shield, Clock, CheckCircle, ArrowRight, Landmark, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden">
                <img src="/src/assets/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">I-KIPUSHI</h1>
                <p className="text-xs text-slate-500 -mt-0.5">Gestion fiscale locale</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                Se connecter
              </Link>
              <Link to="/inscription" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/20">
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
              <Building2 size={14} />
              Plateforme de télédeclaration fiscale
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
              Simplifiez vos
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600"> obligations fiscales</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              Déclarez et payez vos taxes en ligne. Suivez vos obligations, gérez vos pénalités et recevez vos attestations en quelques clics.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/inscription" className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-xl shadow-indigo-500/20">
                Créer mon compte
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                J'ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Comment ça marche ?</h2>
            <p className="mt-3 text-slate-500">Un processus simple en 4 étapes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Inscription", desc: "Créez votre compte en remplissant le formulaire d'inscription avec vos informations.", color: "from-blue-500 to-blue-600", bg: "bg-blue-50", ring: "ring-blue-100" },
              { icon: Shield, title: "Validation", desc: "Un administrateur vérifie et approuve votre compte sous 24 à 48 heures.", color: "from-amber-500 to-orange-500", bg: "bg-amber-50", ring: "ring-amber-100" },
              { icon: FileText, title: "Déclaration", desc: "Connectez-vous et déclarez vos taxes directement en ligne.", color: "from-emerald-500 to-green-500", bg: "bg-emerald-50", ring: "ring-emerald-100" },
              { icon: CheckCircle, title: "Paiement", desc: "Payez vos taxes et téléchargez vos reçus et attestations.", color: "from-violet-500 to-purple-500", bg: "bg-violet-50", ring: "ring-violet-100" },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} ring-1 ${item.ring} mb-5`}>
                  <item.icon className={`bg-gradient-to-r ${item.color} bg-clip-text`} size={26} style={{ color: 'inherit' }} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Pourquoi utiliser I-KIPUSHI ?</h2>
              <div className="space-y-5">
                {[
                  { icon: Clock, title: "Gain de temps", desc: "Plus besoin de vous déplacer. Déclarez et payez en ligne 24h/24." },
                  { icon: FileText, title: "Suivi en temps réel", desc: "Consultez l'état de vos déclarations et vos paiements à tout moment." },
                  { icon: Shield, title: "Sécurisé", desc: "Vos données sont protégées et vos paiements sécurisés." },
                  { icon: CheckCircle, title: "Automatisation", desc: "Calcul automatique des taxes et des pénalités de retard." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
                      <item.icon className="text-indigo-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
              <div className="text-center">
                <div className="flex h-16 w-16 items-center justify-center mx-auto mb-5 overflow-hidden">
                  <img src="/src/assets/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Prêt à commencer ?</h3>
                <p className="text-sm text-slate-400 mb-6">Créez votre compte et commencez à gérer vos obligations fiscales en ligne.</p>
                <Link to="/inscription" className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/20">
                  S'inscrire maintenant
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <img src="/src/assets/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
              I-KIPUSHI — Gestion fiscale locale
            </div>
            <p className="text-xs text-slate-400">&copy; 2026 Mairie. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
