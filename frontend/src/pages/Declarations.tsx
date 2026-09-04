import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  ShieldOff,
  FileText,
  Clock,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { declarationService } from '../services/declarationService';
import type { DeclarationPaiement, PaginatedResponse } from '../types';
import { useAuth } from '../context/AuthContext';

const statutBadge: Record<string, 'warning' | 'success' | 'danger' | 'neutral' | 'info'> = {
  en_attente: 'warning',
  paye: 'success',
  en_retard: 'danger',
  conteste: 'neutral',
  annule: 'neutral',
  exonere: 'info',
};

const statutLabels: Record<string, string> = {
  en_attente: 'En attente',
  paye: 'Payé',
  en_retard: 'En retard',
  conteste: 'Contesté',
  annule: 'Annulé',
  exonere: 'Exonéré',
};

const formatMontant = (val: number | string) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', currencyDisplay: 'code', minimumFractionDigits: 0 }).format(Number(val) || 0);

export default function Declarations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOperateur = user?.roles?.some((r) => r.nom === 'Operateur');
  const [declarations, setDeclarations] = useState<DeclarationPaiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewModal, setViewModal] = useState({ isOpen: false, item: null as DeclarationPaiement | null });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; item: DeclarationPaiement | null; action: '' | 'valider' | 'annuler' | 'exonerer' }>({ isOpen: false, item: null, action: '' });

  const [stats, setStats] = useState({ total: 0, en_attente: 0, paye: 0, en_retard: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchDeclarations = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<DeclarationPaiement> = await declarationService.list({ page, per_page: perPage, search: q });
        setDeclarations(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des déclarations');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await declarationService.statistiques();
      setStats({
        total: (res.total as number) ?? 0,
        en_attente: (res.en_attente as number) ?? 0,
        paye: (res.paye as number) ?? 0,
        en_retard: (res.en_retard as number) ?? 0,
      });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeclarations(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDeclarations(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchDeclarations(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchDeclarations(1, perPage, search);

  const openView = (item: DeclarationPaiement) => setViewModal({ isOpen: true, item });

  const openConfirm = (item: DeclarationPaiement, action: 'valider' | 'annuler' | 'exonerer') => {
    setConfirmModal({ isOpen: true, item, action });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.item) return;
    try {
      if (confirmModal.action === 'valider') {
        await declarationService.valider(confirmModal.item.id);
        toast.success('Déclaration validée');
      } else if (confirmModal.action === 'annuler') {
        await declarationService.annuler(confirmModal.item.id);
        toast.success('Déclaration annulée');
      } else if (confirmModal.action === 'exonerer') {
        await declarationService.exonerer(confirmModal.item.id);
        toast.success('Déclaration exonérée');
      }
      setConfirmModal({ isOpen: false, item: null, action: '' });
      fetchDeclarations(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de l\'action';
      toast.error(msg);
    }
  };

  const confirmMessages: Record<string, string> = {
    valider: 'Êtes-vous sûr de vouloir valider cette déclaration ?',
    annuler: 'Êtes-vous sûr de vouloir annuler cette déclaration ?',
    exonerer: 'Êtes-vous sûr de vouloir exonérer cette déclaration ?',
  };

  const columns = [
    {
      key: 'personne',
      label: 'Opérateur',
      sortable: true,
      render: (item: DeclarationPaiement) => (
        <span className="font-medium text-gray-800">
          {item.personne ? `${item.personne.nom} ${item.personne.prenom ?? ''}`.trim() : `#${item.personne_id}`}
        </span>
      ),
    },
    {
      key: 'taxe',
      label: 'Taxe',
      render: (item: DeclarationPaiement) => (
        <span className="text-sm text-gray-700">{item.taxe?.nom ?? `#${item.taxe_id}`}</span>
      ),
    },
    { key: 'exercice', label: 'Exercice' },
    {
      key: 'montant_total',
      label: 'Montant total',
      sortable: true,
      render: (item: DeclarationPaiement) => (
        <span className="font-medium text-gray-800">{formatMontant(item.montant_total)}</span>
      ),
    },
    {
      key: 'periode',
      label: 'Période',
      render: (item: DeclarationPaiement) => (
        <span className="text-sm text-gray-600">
          {new Date(item.periode_debut).toLocaleDateString('fr-FR')} - {new Date(item.periode_fin).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (item: DeclarationPaiement) => (
        <Badge variant={statutBadge[item.statut] ?? 'neutral'}>{statutLabels[item.statut] ?? item.statut}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: DeclarationPaiement) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openView(item); }}
            className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-colors cursor-pointer"
            title="Voir détail"
          >
            <Eye size={16} />
          </button>
          {!isOperateur && item.statut === 'en_attente' && (
            <button
              onClick={(e) => { e.stopPropagation(); openConfirm(item, 'valider'); }}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
              title="Valider"
            >
              <CheckCircle size={16} />
            </button>
          )}
          {!isOperateur && (item.statut === 'paye' || item.statut === 'en_attente') && (
            <button
              onClick={(e) => { e.stopPropagation(); openConfirm(item, 'annuler'); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
              title="Annuler"
            >
              <XCircle size={16} />
            </button>
          )}
          {!isOperateur && item.statut === 'en_attente' && (
            <button
              onClick={(e) => { e.stopPropagation(); openConfirm(item, 'exonerer'); }}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
              title="Exonérer"
            >
              <ShieldOff size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Déclarations de paiement"
        subtitle="Gestion des déclarations et paiements de taxes"
        actions={
          !isOperateur ? (
            <Button icon={<Plus size={16} />} onClick={() => navigate('/declarations/nouveau')}>
              Nouvelle déclaration
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total} icon={<FileText size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="En attente" value={stats.en_attente} icon={<Clock size={22} />} color="warning" loading={statsLoading} />
        <StatCard title="Payées" value={stats.paye} icon={<BadgeCheck size={22} />} color="success" loading={statsLoading} />
        <StatCard title="En retard" value={stats.en_retard} icon={<AlertTriangle size={22} />} color="danger" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={declarations}
        loading={loading}
        emptyMessage="Aucune déclaration trouvée"
        searchable
        searchPlaceholder="Rechercher une déclaration..."
        onSearch={handleSearch}
        pagination={{
          currentPage: pagination.currentPage,
          lastPage: pagination.lastPage,
          total: pagination.total,
          perPage: pagination.perPage,
          onPageChange: handlePageChange,
          onPerPageChange: handlePerPageChange,
        }}
      />

      <Modal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, item: null })}
        title="Détails de la déclaration"
        size="lg"
      >
        {viewModal.item && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Opérateur</p>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {viewModal.item.personne ? `${viewModal.item.personne.nom} ${viewModal.item.personne.prenom ?? ''}`.trim() : `#${viewModal.item.personne_id}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Taxe</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{viewModal.item.taxe?.nom ?? `#${viewModal.item.taxe_id}`}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Exercice</p>
                <p className="text-sm text-gray-800 mt-1">{viewModal.item.exercice}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Statut</p>
                <div className="mt-1">
                  <Badge variant={statutBadge[viewModal.item.statut] ?? 'neutral'}>
                    {statutLabels[viewModal.item.statut] ?? viewModal.item.statut}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Période</p>
                <p className="text-sm text-gray-800 mt-1">
                  {new Date(viewModal.item.periode_debut).toLocaleDateString('fr-FR')} - {new Date(viewModal.item.periode_fin).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date limite</p>
                <p className="text-sm text-gray-800 mt-1">{new Date(viewModal.item.date_limite_paiement).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Montants</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Montant base</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{formatMontant(viewModal.item.montant_base)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Montant taxe</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{formatMontant(viewModal.item.montant_taxe)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Pénalités</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{formatMontant(viewModal.item.penalites)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Montant total</p>
                  <p className="text-sm font-bold text-primary-600 mt-1">{formatMontant(viewModal.item.montant_total)}</p>
                </div>
              </div>
            </div>

            {viewModal.item.observations && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Observations</p>
                <p className="text-sm text-gray-800 mt-1">{viewModal.item.observations}</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setViewModal({ isOpen: false, item: null })}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null, action: '' })}
        onConfirm={handleConfirmAction}
        title={confirmModal.action === 'valider' ? 'Valider' : confirmModal.action === 'annuler' ? 'Annuler' : 'Exonérer'}
        message={confirmMessages[confirmModal.action] ?? ''}
        confirmText={confirmModal.action === 'valider' ? 'Valider' : confirmModal.action === 'annuler' ? 'Annuler' : 'Exonérer'}
        variant={confirmModal.action === 'valider' ? 'danger' : 'danger'}
      />
    </div>
  );
}
