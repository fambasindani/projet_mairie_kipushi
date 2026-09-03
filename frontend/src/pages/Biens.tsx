import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  Building,
  Home,
  MapPin,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { bienService } from '../services/bienService';
import type { BienImmobilier, PaginatedResponse } from '../types';

const typeBienBadge: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  terrain: 'info',
  maison: 'success',
  appartement: 'warning',
  immeuble: 'danger',
  local_commercial: 'info',
  entrepot: 'neutral',
  autre: 'neutral',
};

const typeBienLabels: Record<string, string> = {
  terrain: 'Terrain',
  maison: 'Maison',
  appartement: 'Appartement',
  immeuble: 'Immeuble',
  local_commercial: 'Local commercial',
  entrepot: 'Entrepôt',
  autre: 'Autre',
};

const formatMontant = (val: number | null) =>
  val != null
    ? new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', currencyDisplay: 'code', minimumFractionDigits: 0 }).format(val)
    : '-';

export default function Biens() {
  const navigate = useNavigate();
  const [biens, setBiens] = useState<BienImmobilier[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as BienImmobilier | null });
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  const [stats, setStats] = useState({ total: 0, actifs: 0, types: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchBiens = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<BienImmobilier> = await bienService.list({ page, per_page: perPage, search: q });
        setBiens(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des biens');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await bienService.statistiques();
      setStats({
        total: (res.total as number) ?? 0,
        actifs: (res.actifs as number) ?? 0,
        types: (res.types as number) ?? 0,
      });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBiens(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBiens(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchBiens(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchBiens(1, perPage, search);

  const openDelete = (item: BienImmobilier) => setConfirmModal({ isOpen: true, item });

  const handleToggle = async (item: BienImmobilier) => {
    setToggleLoading(item.id);
    try {
      await bienService.toggleActivation(item.id);
      toast.success(item.est_actif ? 'Bien désactivé' : 'Bien activé');
      fetchBiens(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors du changement de statut');
    } finally {
      setToggleLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await bienService.delete(confirmModal.item.id);
      toast.success('Bien supprimé');
      setConfirmModal({ isOpen: false, item: null });
      fetchBiens(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns = [
    {
      key: 'adresse',
      label: 'Adresse',
      sortable: true,
      render: (item: BienImmobilier) => (
        <span className="font-medium text-gray-800">{item.adresse ?? '-'}</span>
      ),
    },
    {
      key: 'type_bien',
      label: 'Type',
      render: (item: BienImmobilier) => (
        <Badge variant={typeBienBadge[item.type_bien] ?? 'neutral'}>
          {typeBienLabels[item.type_bien] ?? item.type_bien}
        </Badge>
      ),
    },
    { key: 'commune', label: 'Commune' },
    { key: 'quartier', label: 'Quartier' },
    {
      key: 'superficie',
      label: 'Superficie (m²)',
      sortable: true,
      render: (item: BienImmobilier) => (
        <span className="text-sm text-gray-700">{item.superficie != null ? `${item.superficie} m²` : '-'}</span>
      ),
    },
    {
      key: 'valeur_locative',
      label: 'Valeur locative',
      sortable: true,
      render: (item: BienImmobilier) => (
        <span className="font-medium text-gray-800">{formatMontant(item.valeur_locative)}</span>
      ),
    },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: BienImmobilier) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>
          {item.est_actif ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: BienImmobilier) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/biens/${item.id}/modifier`); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Modifier"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(item); }}
            disabled={toggleLoading === item.id}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors cursor-pointer disabled:opacity-40"
            title="Basculer statut"
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
        title="Biens immobiliers"
        subtitle="Gestion du patrimoine immobilier"
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('/biens/nouveau')}>
            Nouveau bien
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total biens" value={stats.total} icon={<Building size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Actifs" value={stats.actifs} icon={<Home size={22} />} color="success" loading={statsLoading} />
        <StatCard title="Types" value={stats.types} icon={<MapPin size={22} />} color="info" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={biens}
        loading={loading}
        emptyMessage="Aucun bien trouvé"
        searchable
        searchPlaceholder="Rechercher un bien..."
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
        message={`Êtes-vous sûr de vouloir supprimer ce bien immobilier (${confirmModal.item?.adresse ?? 'sans adresse'}) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
