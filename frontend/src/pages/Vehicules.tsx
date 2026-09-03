import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  Car,
  Truck,
  Bike,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { vehiculeService } from '../services/vehiculeService';
import type { Vehicule, PaginatedResponse } from '../types';
import { useAuth } from '../context/AuthContext';

const typeVehiculeBadge: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  voiture: 'info',
  moto: 'success',
  poids_lourd: 'warning',
  bus: 'danger',
  minibus: 'info',
  taxi: 'warning',
  autre: 'neutral',
};

const typeVehiculeLabels: Record<string, string> = {
  voiture: 'Voiture',
  moto: 'Moto',
  poids_lourd: 'Poids lourd',
  bus: 'Bus',
  minibus: 'Minibus',
  taxi: 'Taxi',
  autre: 'Autre',
};

export default function Vehicules() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOperateur = user?.roles?.some((r) => r.nom === 'Operateur');
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Vehicule | null });
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  const [stats, setStats] = useState({ total: 0, actifs: 0, types: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchVehicules = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Vehicule> = await vehiculeService.list({ page, per_page: perPage, search: q });
        setVehicules(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des véhicules');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await vehiculeService.statistiques();
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
    fetchVehicules(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchVehicules(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchVehicules(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchVehicules(1, perPage, search);

  const openDelete = (item: Vehicule) => setConfirmModal({ isOpen: true, item });

  const handleToggle = async (item: Vehicule) => {
    setToggleLoading(item.id);
    try {
      await vehiculeService.toggleActivation(item.id);
      toast.success(item.est_actif ? 'Véhicule désactivé' : 'Véhicule activé');
      fetchVehicules(pagination.currentPage, pagination.perPage, search);
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
      await vehiculeService.delete(confirmModal.item.id);
      toast.success('Véhicule supprimé');
      setConfirmModal({ isOpen: false, item: null });
      fetchVehicules(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns = [
    {
      key: 'plaque_immatriculation',
      label: 'Plaque immatriculation',
      sortable: true,
      render: (item: Vehicule) => (
        <span className="font-mono text-sm font-medium text-primary-600">{item.plaque_immatriculation}</span>
      ),
    },
    {
      key: 'marque_modele',
      label: 'Marque / Modèle',
      render: (item: Vehicule) => (
        <span className="font-medium text-gray-800">
          {item.marque ?? '-'} {item.modele ? `/ ${item.modele}` : ''}
        </span>
      ),
    },
    {
      key: 'type_vehicule',
      label: 'Type',
      render: (item: Vehicule) => (
        <Badge variant={typeVehiculeBadge[item.type_vehicule] ?? 'neutral'}>
          {typeVehiculeLabels[item.type_vehicule] ?? item.type_vehicule}
        </Badge>
      ),
    },
    {
      key: 'annee_fabrication',
      label: 'Année',
      sortable: true,
      render: (item: Vehicule) => (
        <span className="text-sm text-gray-700">{item.annee_fabrication ?? '-'}</span>
      ),
    },
    {
      key: 'couleur',
      label: 'Couleur',
      render: (item: Vehicule) => (
        <span className="text-sm text-gray-700">{item.couleur ?? '-'}</span>
      ),
    },
    {
      key: 'proprietaire',
      label: 'Propriétaire',
      render: (item: Vehicule) => (
        <span className="text-sm text-gray-700">
          {item.proprietaire ? `${item.proprietaire.nom} ${item.proprietaire.prenom ?? ''}`.trim() : `#${item.proprietaire_id}`}
        </span>
      ),
    },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: Vehicule) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>
          {item.est_actif ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Vehicule) => (
        isOperateur ? null : (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/vehicules/${item.id}/modifier`); }}
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
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Véhicules"
        subtitle="Gestion du parc automobile"
        actions={
          !isOperateur ? (
            <Button icon={<Plus size={16} />} onClick={() => navigate('/vehicules/nouveau')}>
              Nouveau véhicule
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total véhicules" value={stats.total} icon={<Car size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Actifs" value={stats.actifs} icon={<Truck size={22} />} color="success" loading={statsLoading} />
        <StatCard title="Types" value={stats.types} icon={<Bike size={22} />} color="info" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={vehicules}
        loading={loading}
        emptyMessage="Aucun véhicule trouvé"
        searchable
        searchPlaceholder="Rechercher un véhicule..."
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
        message={`Êtes-vous sûr de vouloir supprimer le véhicule "${confirmModal.item?.plaque_immatriculation}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
