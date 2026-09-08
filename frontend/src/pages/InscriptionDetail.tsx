import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, User, UserCheck, UserX, Mail, Phone, MapPin, Calendar, Shield, Briefcase } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ConfirmModal from '../components/ui/ConfirmModal';
import Modal from '../components/ui/Modal';
import { inscriptionService, type Inscription } from '../services/inscriptionService';

const statutBadge: Record<string, 'warning' | 'success' | 'danger'> = {
  en_attente: 'warning',
  approuve: 'success',
  rejete: 'danger',
};

const statutLabels: Record<string, string> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  rejete: 'Rejeté',
};

const formatMontant = (val: number | string) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', currencyDisplay: 'code', minimumFractionDigits: 0 }).format(Number(val) || 0);

export default function InscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inscription, setInscription] = useState<Inscription | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmApprouver, setConfirmApprouver] = useState(false);
  const [confirmRejeter, setConfirmRejeter] = useState(false);
  const [motifRejet, setMotifRejet] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    inscriptionService.get(Number(id))
      .then((data) => setInscription(data))
      .catch(() => {
        toast.error('Erreur lors du chargement');
        navigate('/inscriptions');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprouver = async () => {
    if (!inscription) return;
    setProcessing(true);
    try {
      await inscriptionService.approuver(inscription.id);
      toast.success('Inscription approuvée');
      setConfirmApprouver(false);
      const updated = await inscriptionService.get(inscription.id);
      setInscription(updated);
    } catch {
      toast.error("Erreur lors de l'approbation");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejeter = async () => {
    if (!inscription || !motifRejet.trim()) return;
    setProcessing(true);
    try {
      await inscriptionService.rejeter(inscription.id, motifRejet);
      toast.success('Inscription rejetée');
      setConfirmRejeter(false);
      setMotifRejet('');
      const updated = await inscriptionService.get(inscription.id);
      setInscription(updated);
    } catch {
      toast.error('Erreur lors du rejet');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Détail de l'inscription" subtitle="Chargement..." actions={<Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/inscriptions')}>Retour</Button>} />
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!inscription) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${inscription.personne?.nom ?? ''} ${inscription.personne?.prenom ?? ''}`.trim() || 'Inscription'}
        subtitle={inscription.email}
        actions={
          <div className="flex items-center gap-2">
            {inscription.statut_inscription === 'en_attente' && (
              <>
                <Button variant="secondary" icon={<UserX size={16} />} onClick={() => { setMotifRejet(''); setConfirmRejeter(true); }} className="text-red-600 hover:bg-red-50">
                  Rejeter
                </Button>
                <Button icon={<UserCheck size={16} />} onClick={() => setConfirmApprouver(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Approuver
                </Button>
              </>
            )}
            <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/inscriptions')}>
              Retour
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos principales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Informations personnelles</h3>
              <Badge variant={statutBadge[inscription.statut_inscription]}>
                {statutLabels[inscription.statut_inscription]}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-5 text-sm">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Email</p>
                  <p className="text-slate-800 font-medium">{inscription.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Téléphone</p>
                  <p className="text-slate-800 font-medium">{inscription.personne?.telephone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Date de naissance</p>
                  <p className="text-slate-800 font-medium">
                    {inscription.personne?.date_naissance ? new Date(inscription.personne.date_naissance).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Adresse</p>
                  <p className="text-slate-800 font-medium">{inscription.personne?.adresse || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User size={16} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Sexe</p>
                  <p className="text-slate-800 font-medium">
                    {inscription.personne?.sexe === 'M' ? 'Masculin' : inscription.personne?.sexe === 'F' ? 'Féminin' : inscription.personne?.sexe || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Lieu de naissance</p>
                  <p className="text-slate-800 font-medium">{inscription.personne?.lieu_naissance || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Nationalité</p>
                  <p className="text-slate-800 font-medium">{inscription.personne?.nationalite || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Date d'inscription</p>
                  <p className="text-slate-800 font-medium">
                    {inscription.date_inscription ? new Date(inscription.date_inscription).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dénomination / forme juridique (morale) */}
          {(inscription.personne?.denomination_sociale || inscription.personne?.forme_juridique) && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Informations légales</h3>
              <div className="grid grid-cols-2 gap-5 text-sm">
                {inscription.personne?.denomination_sociale && (
                  <div>
                    <p className="text-slate-400 text-xs">Dénomination sociale</p>
                    <p className="text-slate-800 font-medium">{inscription.personne.denomination_sociale}</p>
                  </div>
                )}
                {inscription.personne?.forme_juridique && (
                  <div>
                    <p className="text-slate-400 text-xs">Forme juridique</p>
                    <p className="text-slate-800 font-medium">{inscription.personne.forme_juridique}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Motif rejet */}
          {inscription.motif_rejet && (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">Motif du rejet</h3>
              <p className="text-sm text-red-700">{inscription.motif_rejet}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activités */}
          {inscription.personne?.activites && inscription.personne.activites.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Briefcase size={16} /> Activités
              </h3>
              <div className="space-y-2">
                {inscription.personne.activites.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <Badge variant="info">{a.nom}</Badge>
                    <span className="text-slate-400">({a.secteur})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Identifiants */}
          {inscription.personne?.identifiants && inscription.personne.identifiants.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Shield size={16} /> Identifiants
              </h3>
              <div className="space-y-2">
                {inscription.personne.identifiants.map((i) => (
                  <div key={i.id} className="text-sm">
                    <span className="text-slate-500">{i.type_identifiant}:</span>{' '}
                    <span className="font-mono text-slate-800">{i.valeur}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions rapides */}
          {inscription.statut_inscription === 'en_attente' && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Actions</h3>
              <div className="space-y-2">
                <Button onClick={() => setConfirmApprouver(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" icon={<UserCheck size={16} />}>
                  Approuver
                </Button>
                <Button onClick={() => { setMotifRejet(''); setConfirmRejeter(true); }} className="w-full bg-red-600 hover:bg-red-700 text-white" icon={<UserX size={16} />}>
                  Rejeter
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Approuver */}
      <ConfirmModal
        isOpen={confirmApprouver}
        onClose={() => setConfirmApprouver(false)}
        onConfirm={handleApprouver}
        title="Approuver l'inscription"
        message={`Approuver l'inscription de "${inscription.personne?.nom} ${inscription.personne?.prenom}" (${inscription.email}) ? Le compte sera activé avec le rôle Opérateur.`}
        confirmText="Approuver"
        variant="danger"
      />

      {/* Confirm Rejeter */}
      <Modal isOpen={confirmRejeter} onClose={() => { setConfirmRejeter(false); setMotifRejet(''); }} title="Rejeter l'inscription" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Rejeter l'inscription de <strong>{inscription.personne?.nom} {inscription.personne?.prenom}</strong> ?
          </p>
          <Input label="Motif du rejet *" value={motifRejet} onChange={(e) => setMotifRejet(e.target.value)} placeholder="Indiquez la raison du rejet..." error={!motifRejet.trim() ? 'Le motif est requis' : ''} />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => { setConfirmRejeter(false); setMotifRejet(''); }}>Annuler</Button>
            <Button onClick={handleRejeter} loading={processing} className="bg-red-600 hover:bg-red-700 text-white" icon={<UserX size={16} />}>Rejeter</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
