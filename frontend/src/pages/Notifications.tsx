import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Trash2,
  Bell,
  CheckCircle,
  Clock,
  Eye,
  CheckCheck,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { notificationService } from '../services/notificationService';
import type { Notification, PaginatedResponse } from '../types';

const typeNotificationBadge: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  paiement_echu: 'danger',
  renouvellement_permis: 'warning',
  controle_prochain: 'info',
  information: 'success',
};

const typeNotificationLabels: Record<string, string> = {
  paiement_echu: 'Paiement échu',
  renouvellement_permis: 'Renouvellement permis',
  controle_prochain: 'Contrôle à venir',
  information: 'Information',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Notification | null });

  const [stats, setStats] = useState({ total: 0, nonLues: 0, aujourdHui: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchNotifications = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Notification> = await notificationService.list({ page, per_page: perPage, search: q });
        setNotifications(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des notifications');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await notificationService.list({ per_page: 9999 });
      const all = res.data;
      const nonLues = all.filter((n) => !n.est_lue).length;
      const today = new Date().toISOString().split('T')[0];
      const aujourdHui = all.filter((n) => n.date_envoi.startsWith(today)).length;
      setStats({ total: res.total, nonLues, aujourdHui });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchNotifications(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchNotifications(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchNotifications(1, perPage, search);

  const handleMarkAsRead = async (item: Notification) => {
    try {
      await notificationService.lire(item.id);
      toast.success('Notification marquée comme lue');
      fetchNotifications(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.lireToutes();
      toast.success('Toutes les notifications marquées comme lues');
      fetchNotifications(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await notificationService.delete(confirmModal.item.id);
      toast.success('Notification supprimée');
      setConfirmModal({ isOpen: false, item: null });
      fetchNotifications(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openDelete = (item: Notification) => setConfirmModal({ isOpen: true, item });

  const columns = [
    {
      key: 'sujet',
      label: 'Sujet',
      sortable: true,
      render: (item: Notification) => (
        <span className={`font-medium ${item.est_lue ? 'text-gray-700' : 'text-gray-900'}`}>
          {item.sujet}
        </span>
      ),
    },
    {
      key: 'type_notification',
      label: 'Type',
      render: (item: Notification) => (
        <Badge variant={typeNotificationBadge[item.type_notification] ?? 'neutral'}>
          {typeNotificationLabels[item.type_notification] ?? item.type_notification}
        </Badge>
      ),
    },
    {
      key: 'message',
      label: 'Message',
      render: (item: Notification) => (
        <span className="text-sm text-gray-600 line-clamp-1" title={item.message}>
          {item.message.length > 80 ? item.message.slice(0, 80) + '...' : item.message}
        </span>
      ),
    },
    {
      key: 'date_envoi',
      label: 'Date envoi',
      sortable: true,
      render: (item: Notification) => (
        <span className="text-sm text-gray-500">
          {new Date(item.date_envoi).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'est_lue',
      label: 'Lu',
      render: (item: Notification) => (
        <Badge variant={item.est_lue ? 'success' : 'warning'}>
          {item.est_lue ? 'Lu' : 'Non lu'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Notification) => (
        <div className="flex items-center gap-1">
          {!item.est_lue && (
            <button
              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(item); }}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
              title="Marquer comme lue"
            >
              <Eye size={16} />
            </button>
          )}
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
        title="Notifications"
        subtitle="Gestion des notifications"
        actions={
          <Button icon={<CheckCheck size={16} />} variant="secondary" onClick={handleMarkAllAsRead}>
            Marquer toutes comme lues
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total" value={stats.total} icon={<Bell size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Non lues" value={stats.nonLues} icon={<Clock size={22} />} color="warning" loading={statsLoading} />
        <StatCard title="Aujourd'hui" value={stats.aujourdHui} icon={<CheckCircle size={22} />} color="success" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={notifications}
        loading={loading}
        emptyMessage="Aucune notification"
        searchable
        searchPlaceholder="Rechercher une notification..."
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
        message={`Êtes-vous sûr de vouloir supprimer la notification "${confirmModal.item?.sujet}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
