import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  FileCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { permisService } from '../services/permisService';
import type { PermisAutorisation, PaginatedResponse } from '../types';
import { useAuth } from '../context/AuthContext';

const typePermisBadge: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  patente: 'info',
  construire: 'warning',
  occupation_sol: 'success',
  etalage: 'warning',
  exploitation: 'info',
  transport: 'danger',
  autre: 'neutral',
};

const typePermisLabels: Record<string, string> = {
  patente: 'Patente',
  construire: 'Construire',
  occupation_sol: 'Occupation du sol',
  etalage: 'Étalage',
  exploitation: 'Exploitation',
  transport: 'Transport',
  autre: 'Autre',
};

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function isExpiringSoon(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

export default function Permis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOperateur = user?.roles?.some((r) => r.nom === 'Operateur');
  const [permis, setPermis] = useState<PermisAutorisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as PermisAutorisation | null });
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  const [stats, setStats] = useState({ total: 0, valides: 0, enExpiration: 0, expires: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchPermis = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<PermisAutorisation> = await permisService.list({ page, per_page: perPage, search: q });
        setPermis(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des permis');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await permisService.list({ per_page: 9999 });
      const all = res.data;
      const now = new Date();
      const valides = all.filter((p) => p.est_valide && new Date(p.date_expiration) >= now).length;
      const expires = all.filter((p) => !p.est_valide || new Date(p.date_expiration) < now).length;
      const enExpiration = all.filter((p) => p.est_valide && isExpiringSoon(p.date_expiration)).length;
      setStats({ total: res.total, valides, enExpiration, expires });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermis(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPermis(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchPermis(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchPermis(1, perPage, search);

  const openDelete = (item: PermisAutorisation) => setConfirmModal({ isOpen: true, item });

  const handleToggle = async (item: PermisAutorisation) => {
    setToggleLoading(item.id);
    try {
      await permisService.toggleValidation(item.id);
      toast.success(item.est_valide ? 'Permis invalidé' : 'Permis validé');
      fetchPermis(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors du changement de validation');
    } finally {
      setToggleLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await permisService.delete(confirmModal.item.id);
      toast.success('Permis supprimé');
      setConfirmModal({ isOpen: false, item: null });
      fetchPermis(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns = [
    {
      key: 'numero',
      label: 'Numéro',
      sortable: true,
      render: (item: PermisAutorisation) => (
        <span className="font-mono text-sm font-medium text-primary-600">{item.numero}</span>
      ),
    },
    {
      key: 'type_permis',
      label: 'Type',
      render: (item: PermisAutorisation) => (
        <Badge variant={typePermisBadge[item.type_permis] ?? 'neutral'}>
          {typePermisLabels[item.type_permis] ?? item.type_permis}
        </Badge>
      ),
    },
    {
      key: 'personne',
      label: 'Personne',
      render: (item: PermisAutorisation) => (
        <span className="text-sm text-gray-700">
          {item.personne ? `${item.personne.nom} ${item.personne.prenom ?? ''}`.trim() : `#${item.personne_id}`}
        </span>
      ),
    },
    {
      key: 'date_delivrance',
      label: 'Date délivrance',
      sortable: true,
      render: (item: PermisAutorisation) => (
        <span className="text-sm text-gray-700">
          {new Date(item.date_delivrance).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'date_expiration',
      label: 'Date expiration',
      sortable: true,
      render: (item: PermisAutorisation) => (
        <span className="text-sm text-gray-700">
          {new Date(item.date_expiration).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'validite',
      label: 'Validité',
      render: (item: PermisAutorisation) => {
        if (isExpired(item.date_expiration)) {
          return <Badge variant="danger">Expiré</Badge>;
        }
        if (isExpiringSoon(item.date_expiration)) {
          return <Badge variant="warning">En expiration</Badge>;
        }
        return <Badge variant="success">Valide</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: PermisAutorisation) => (
        isOperateur ? null : (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/permis/${item.id}/modifier`); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Modifier"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(item); }}
            disabled={toggleLoading === item.id}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors cursor-pointer disabled:opacity-40"
            title="Basculer validation"
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
        title="Permis & Autorisations"
        subtitle="Gestion des permis et autorisations"
        actions={
          !isOperateur ? (
            <Button icon={<Plus size={16} />} onClick={() => navigate('/permis/nouveau')}>
              Nouveau permis
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total} icon={<FileCheck size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Valides" value={stats.valides} icon={<CheckCircle size={22} />} color="success" loading={statsLoading} />
        <StatCard title="En expiration" value={stats.enExpiration} icon={<Clock size={22} />} color="warning" loading={statsLoading} />
        <StatCard title="Expirés" value={stats.expires} icon={<AlertTriangle size={22} />} color="danger" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={permis}
        loading={loading}
        emptyMessage="Aucun permis trouvé"
        searchable
        searchPlaceholder="Rechercher un permis..."
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
        message={`Êtes-vous sûr de vouloir supprimer le permis "${confirmModal.item?.numero}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
