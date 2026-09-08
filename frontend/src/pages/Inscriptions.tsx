import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserCheck, UserX, Clock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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

export default function Inscriptions() {
  const navigate = useNavigate();
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });

  const [confirmApprouver, setConfirmApprouver] = useState<Inscription | null>(null);
  const [confirmRejeter, setConfirmRejeter] = useState<Inscription | null>(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [processing, setProcessing] = useState(false);

  const [stats, setStats] = useState({ total: 0, enAttente: 0, approuves: 0, rejetes: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchInscriptions = useCallback(async (page = 1, perPage = 20) => {
    setLoading(true);
    try {
      const res = await inscriptionService.list({ page, per_page: perPage });
      setInscriptions(res.data);
      setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [allRes, attenteRes, approuveRes, rejeteRes] = await Promise.all([
        inscriptionService.list({ per_page: 1 }),
        inscriptionService.list({ statut: 'en_attente', per_page: 1 }),
        inscriptionService.list({ statut: 'approuve', per_page: 1 }),
        inscriptionService.list({ statut: 'rejete', per_page: 1 }),
      ]);
      setStats({
        total: allRes.total,
        enAttente: attenteRes.total,
        approuves: approuveRes.total,
        rejetes: rejeteRes.total,
      });
    } catch {} finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInscriptions(); fetchStats(); }, []);

  const handleApprouver = async () => {
    if (!confirmApprouver) return;
    setProcessing(true);
    try {
      await inscriptionService.approuver(confirmApprouver.id);
      toast.success('Inscription approuvée');
      setConfirmApprouver(null);
      fetchInscriptions(pagination.currentPage, pagination.perPage);
      fetchStats();
    } catch {
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejeter = async () => {
    if (!confirmRejeter || !motifRejet.trim()) return;
    setProcessing(true);
    try {
      await inscriptionService.rejeter(confirmRejeter.id, motifRejet);
      toast.success('Inscription rejetée');
      setConfirmRejeter(null);
      setMotifRejet('');
      fetchInscriptions(pagination.currentPage, pagination.perPage);
      fetchStats();
    } catch {
      toast.error('Erreur lors du rejet');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      key: 'personne',
      label: 'Nom complet',
      render: (item: Inscription) => (
        <span className="font-medium text-gray-800">
          {item.personne ? `${item.personne.nom} ${item.personne.prenom ?? ''}`.trim() : '—'}
        </span>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'date_inscription',
      label: 'Date inscription',
      render: (item: Inscription) => (
        <span className="text-sm text-gray-500">
          {item.date_inscription ? new Date(item.date_inscription).toLocaleDateString('fr-FR') : '—'}
        </span>
      ),
    },
    {
      key: 'statut_inscription',
      label: 'Statut',
      render: (item: Inscription) => (
        <Badge variant={statutBadge[item.statut_inscription] ?? 'neutral'}>
          {statutLabels[item.statut_inscription] ?? item.statut_inscription}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Inscription) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/inscriptions/${item.id}`); }}
            className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-colors cursor-pointer"
            title="Voir détail"
          >
            <Eye size={16} />
          </button>
          {item.statut_inscription === 'en_attente' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmApprouver(item); }}
                className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                title="Approuver"
              >
                <UserCheck size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmRejeter(item); setMotifRejet(''); }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                title="Rejeter"
              >
                <UserX size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Inscriptions" subtitle="Demandes d'inscription en attente de validation" />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total} icon={<UserCheck size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="En attente" value={stats.enAttente} icon={<Clock size={22} />} color="warning" loading={statsLoading} />
        <StatCard title="Approuvées" value={stats.approuves} icon={<CheckCircle size={22} />} color="success" loading={statsLoading} />
        <StatCard title="Rejetées" value={stats.rejetes} icon={<EyeOff size={22} />} color="danger" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={inscriptions}
        loading={loading}
        emptyMessage="Aucune inscription"
        pagination={{
          currentPage: pagination.currentPage,
          lastPage: pagination.lastPage,
          total: pagination.total,
          perPage: pagination.perPage,
          onPageChange: (page) => fetchInscriptions(page, pagination.perPage),
          onPerPageChange: (perPage) => fetchInscriptions(1, perPage),
        }}
      />

      {/* Confirm Approuver */}
      <ConfirmModal
        isOpen={!!confirmApprouver}
        onClose={() => setConfirmApprouver(null)}
        onConfirm={handleApprouver}
        title="Approuver l'inscription"
        message={`Approuver l'inscription de "${confirmApprouver?.personne?.nom} ${confirmApprouver?.personne?.prenom}" (${confirmApprouver?.email}) ? Le compte sera activé avec le rôle Opérateur.`}
        confirmText="Approuver"
        variant="danger"
      />

      {/* Confirm Rejeter */}
      <Modal isOpen={!!confirmRejeter} onClose={() => { setConfirmRejeter(null); setMotifRejet(''); }} title="Rejeter l'inscription" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Rejeter l'inscription de <strong>{confirmRejeter?.personne?.nom} {confirmRejeter?.personne?.prenom}</strong> ?
          </p>
          <Input label="Motif du rejet *" value={motifRejet} onChange={(e) => setMotifRejet(e.target.value)} placeholder="Indiquez la raison du rejet..." error={!motifRejet.trim() ? 'Le motif est requis' : ''} />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => { setConfirmRejeter(null); setMotifRejet(''); }}>Annuler</Button>
            <Button onClick={handleRejeter} loading={processing} className="bg-red-600 hover:bg-red-700 text-white" icon={<UserX size={16} />}>Rejeter</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
