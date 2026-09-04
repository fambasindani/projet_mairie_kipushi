import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Users,
  CheckCircle,
  ShieldCheck,
  Pencil,
  ToggleLeft,
  Trash2,
  Eye,
  Printer,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { personneService } from '../services/personneService';
import { FicheOperateurDocument } from '../components/FicheOperateurPDF';
import QRCode from 'qrcode';
import type { Personne, PaginatedResponse } from '../types';

export default function Operateurs() {
  const navigate = useNavigate();
  const [operateurs, setOperateurs] = useState<Personne[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Personne | null });
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  const [stats, setStats] = useState({ total: 0, actifs: 0, formalises: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchOperateurs = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Personne> = await personneService.list({
          page,
          per_page: perPage,
          search: q,
        });
        setOperateurs(res.data);
        setPagination({
          currentPage: res.current_page,
          lastPage: res.last_page,
          total: res.total,
          perPage: res.per_page,
        });
      } catch {
        toast.error('Erreur lors du chargement des opérateurs');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await personneService.statistiques();
      setStats({
        total: (res.total as number) ?? 0,
        actifs: (res.actifs as number) ?? 0,
        formalises: (res.formalises as number) ?? 0,
      });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperateurs(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOperateurs(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => {
    fetchOperateurs(page, pagination.perPage, search);
  };

  const handlePerPageChange = (perPage: number) => {
    fetchOperateurs(1, perPage, search);
  };

  const openDelete = (item: Personne) => {
    setConfirmModal({ isOpen: true, item });
  };

  const handleToggle = async (item: Personne) => {
    setToggleLoading(item.id);
    try {
      await personneService.toggleActivation(item.id);
      toast.success(item.est_actif ? 'Opérateur désactivé' : 'Opérateur activé');
      fetchOperateurs(pagination.currentPage, pagination.perPage, search);
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
      await personneService.delete(confirmModal.item.id);
      toast.success('Opérateur supprimé');
      setConfirmModal({ isOpen: false, item: null });
      fetchOperateurs(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handlePrintFiche = async (item: Personne) => {
    try {
      const qrData = JSON.stringify({ type: 'GS_OPERATEUR_ID', id: item.id, nom: item.nom, prenom: item.prenom, type_personne: item.type });
      const qrDataUrl = await QRCode.toDataURL(qrData, { width: 150, margin: 1, color: { dark: '#1e293b', light: '#ffffff' } });
      let photoDataUrl: string | null = null;
      if (item.avatar_url) {
        photoDataUrl = item.avatar_url;
      } else if (item.avatar) {
        try {
          const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
          const url = item.avatar.startsWith('http') ? item.avatar : `${base}/profile/avatar/${item.id}`;
          const token = localStorage.getItem('token');
          const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          const blob = await resp.blob();
          photoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch { /* no photo */ }
      }
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(<FicheOperateurDocument personne={item} qrDataUrl={qrDataUrl} photoDataUrl={photoDataUrl} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur lors de la génération de la fiche');
    }
  };

  const columns = [
    {
      key: 'nom',
      label: 'Nom complet',
      sortable: true,
      render: (item: Personne) => (
        <span className="font-medium text-gray-800">
          {item.nom} {item.prenom}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (item: Personne) => (
        <Badge variant={item.type === 'physique' ? 'info' : 'warning'}>
          {item.type === 'physique' ? 'Physique' : 'Morale'}
        </Badge>
      ),
    },
    { key: 'commune', label: 'Commune' },
    { key: 'telephone', label: 'Téléphone' },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: Personne) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>
          {item.est_actif ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Personne) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/operateurs/${item.id}`); }}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Voir le détail"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/operateurs/${item.id}/modifier`); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Modifier"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrintFiche(item); }}
            className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-500 hover:text-violet-600 transition-colors cursor-pointer"
            title="Imprimer fiche"
          >
            <Printer size={16} />
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
        title="Opérateurs"
        subtitle="Gestion des personnes physiques et morales"
        actions={
          <Button icon={<UserPlus size={16} />} onClick={() => navigate('/operateurs/nouveau')}>
            Nouvel opérateur
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total opérateurs"
          value={stats.total}
          icon={<Users size={22} />}
          color="primary"
          loading={statsLoading}
        />
        <StatCard
          title="Actifs"
          value={stats.actifs}
          icon={<CheckCircle size={22} />}
          color="success"
          loading={statsLoading}
        />
        <StatCard
          title="Formalisés"
          value={stats.formalises}
          icon={<ShieldCheck size={22} />}
          color="info"
          loading={statsLoading}
        />
      </div>

      <DataTable
        columns={columns}
        data={operateurs}
        loading={loading}
        emptyMessage="Aucun opérateur trouvé"
        onRowClick={(item) => navigate(`/operateurs/${item.id}`)}
        searchable
        searchPlaceholder="Rechercher un opérateur..."
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
        message={`Êtes-vous sûr de vouloir supprimer l'opérateur "${confirmModal.item?.nom} ${confirmModal.item?.prenom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
