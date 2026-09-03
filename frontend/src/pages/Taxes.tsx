import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  Receipt,
  CheckCircle,
  DollarSign,
  Percent,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { taxeService } from '../services/taxeService';
import type { Taxe, PaginatedResponse } from '../types';

const categorieLabels: Record<string, string> = {
  patente: 'Patente',
  foncier: 'Foncier',
  revenus_locatifs: 'Revenus locatifs',
  personnel_minimum: 'Personnel minimum',
  vehicule: 'Véhicule',
  permis_construire: 'Permis construire',
  etalage: 'Étalage',
  autre: 'Autre',
};

const categorieBadge: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  patente: 'info',
  foncier: 'success',
  revenus_locatifs: 'warning',
  personnel_minimum: 'danger',
  vehicule: 'info',
  permis_construire: 'warning',
  etalage: 'success',
  autre: 'neutral',
};

export default function Taxes() {
  const navigate = useNavigate();
  const [taxes, setTaxes] = useState<Taxe[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Taxe | null });

  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    montantFixe: 0,
    pourcentage: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchTaxes = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Taxe> = await taxeService.list({
          page,
          per_page: perPage,
          search: q,
        });
        setTaxes(res.data);
        setPagination({
          currentPage: res.current_page,
          lastPage: res.last_page,
          total: res.total,
          perPage: res.per_page,
        });
      } catch {
        toast.error('Erreur lors du chargement des taxes');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await taxeService.statistiques();
      setStats({
        total: (res.total as number) ?? 0,
        actives: (res.actives as number) ?? 0,
        montantFixe: (res.montant_fixe as number) ?? 0,
        pourcentage: (res.pourcentage as number) ?? 0,
      });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxes(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTaxes(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => {
    fetchTaxes(page, pagination.perPage, search);
  };

  const handlePerPageChange = (perPage: number) => {
    fetchTaxes(1, perPage, search);
  };

  const openDelete = (item: Taxe) => {
    setConfirmModal({ isOpen: true, item });
  };

  const handleToggle = async (item: Taxe) => {
    try {
      await taxeService.toggleActivation(item.id);
      toast.success(item.est_actif ? 'Taxe désactivée' : 'Taxe activée');
      fetchTaxes(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await taxeService.delete(confirmModal.item.id);
      toast.success('Taxe supprimée');
      setConfirmModal({ isOpen: false, item: null });
      fetchTaxes(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatMontant = (taxe: Taxe): string => {
    if (taxe.unite === 'pourcentage') return `${taxe.taux ?? 0}%`;
    if (taxe.unite === 'montant_fixe') {
      return new Intl.NumberFormat('fr-CD', {
        style: 'currency',
        currency: 'CDF',
        currencyDisplay: 'code',
        minimumFractionDigits: 0,
      }).format(taxe.taux ?? 0);
    }
    return `${taxe.taux ?? 0} / unité`;
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (item: Taxe) => (
        <span className="font-mono text-sm font-medium text-primary-600">{item.code}</span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (item: Taxe) => (
        <span className="font-medium text-gray-800">{item.nom}</span>
      ),
    },
    {
      key: 'categorie',
      label: 'Catégorie',
      render: (item: Taxe) => (
        <Badge variant={categorieBadge[item.categorie] ?? 'neutral'}>
          {categorieLabels[item.categorie] ?? item.categorie}
        </Badge>
      ),
    },
    {
      key: 'taux',
      label: 'Taux / Montant',
      sortable: true,
      render: (item: Taxe) => (
        <span className="font-medium text-gray-800">{formatMontant(item)}</span>
      ),
    },
    {
      key: 'periodicite',
      label: 'Périodicité',
      render: (item: Taxe) => (
        <span className="text-sm text-gray-600 capitalize">{item.periodicite}</span>
      ),
    },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: Taxe) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>
          {item.est_actif ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Taxe) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/taxes/${item.id}/modifier`); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Modifier"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(item); }}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors cursor-pointer"
            title="Basculer actif/inactif"
          >
            <ToggleLeft size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openDelete(item); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxes"
        subtitle="Gestion des taxes et impôts locaux"
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('/taxes/nouveau')}>
            Nouvelle taxe
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total taxes"
          value={stats.total}
          icon={<Receipt size={22} />}
          color="primary"
          loading={statsLoading}
        />
        <StatCard
          title="Actives"
          value={stats.actives}
          icon={<CheckCircle size={22} />}
          color="success"
          loading={statsLoading}
        />
        <StatCard
          title="Montant fixe"
          value={stats.montantFixe}
          icon={<DollarSign size={22} />}
          color="warning"
          loading={statsLoading}
        />
        <StatCard
          title="Pourcentage"
          value={stats.pourcentage}
          icon={<Percent size={22} />}
          color="info"
          loading={statsLoading}
        />
      </div>

      <DataTable
        columns={columns}
        data={taxes}
        loading={loading}
        emptyMessage="Aucune taxe trouvée"
        searchable
        searchPlaceholder="Rechercher une taxe..."
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Supprimer"
        message={`Êtes-vous sûr de vouloir supprimer la taxe "${confirmModal.item?.nom}" (${confirmModal.item?.code}) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
