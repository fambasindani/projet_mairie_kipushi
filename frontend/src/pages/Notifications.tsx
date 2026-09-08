import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Trash2,
  Bell,
  CheckCircle,
  Clock,
  Eye,
  CheckCheck,
  AlertTriangle,
  Send,
  Info,
  FileText,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { notificationService } from '../services/notificationService';
import type { Notification, PaginatedResponse } from '../types';

const typeNotificationBadge: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  paiement_echu: 'danger',
  renouvellement_permis: 'warning',
  controle_prochain: 'info',
  mise_en_demeure: 'danger',
  information: 'success',
};

const typeNotificationLabels: Record<string, string> = {
  paiement_echu: 'Paiement échu',
  renouvellement_permis: 'Renouvellement permis',
  controle_prochain: 'Contrôle à venir',
  mise_en_demeure: 'Mise en demeure',
  information: 'Information',
};

const typeNotificationIcons: Record<string, typeof Bell> = {
  paiement_echu: AlertTriangle,
  renouvellement_permis: Clock,
  controle_prochain: Info,
  mise_en_demeure: Send,
  information: FileText,
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
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; item: Notification | null }>({ isOpen: false, item: null });

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

  const openDetail = (item: Notification) => {
    setDetailModal({ isOpen: true, item });
    if (!item.est_lue) {
      handleMarkAsRead(item);
    }
  };

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
          <button
            onClick={(e) => { e.stopPropagation(); openDetail(item); }}
            className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-colors cursor-pointer"
            title="Voir le détail"
          >
            <Eye size={16} />
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
        onRowClick={(item) => openDetail(item)}
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

      <Modal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, item: null })}
        title="Détail de la notification"
        size="md"
      >
        {detailModal.item && (() => {
          const Icon = typeNotificationIcons[detailModal.item.type_notification] ?? Bell;
          const iconColors: Record<string, string> = {
            paiement_echu: 'bg-red-50 text-red-600 ring-red-100',
            renouvellement_permis: 'bg-amber-50 text-amber-600 ring-amber-100',
            controle_prochain: 'bg-blue-50 text-blue-600 ring-blue-100',
            mise_en_demeure: 'bg-orange-50 text-orange-600 ring-orange-100',
            information: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
          };
          return (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${iconColors[detailModal.item.type_notification] ?? 'bg-gray-50 text-gray-600 ring-gray-100'}`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900">{detailModal.item.sujet}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={typeNotificationBadge[detailModal.item.type_notification] ?? 'info'}>
                      {typeNotificationLabels[detailModal.item.type_notification] ?? detailModal.item.type_notification}
                    </Badge>
                    <Badge variant={detailModal.item.est_lue ? 'success' : 'warning'}>
                      {detailModal.item.est_lue ? 'Lu' : 'Non lu'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{detailModal.item.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Date d'envoi</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {new Date(detailModal.item.date_envoi).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                {detailModal.item.date_lecture && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Date de lecture</p>
                    <p className="text-sm font-medium text-slate-700 mt-1">
                      {new Date(detailModal.item.date_lecture).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {detailModal.item.lien_action && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Lien :</span>
                  <a
                    href={`#${detailModal.item.lien_action}`}
                    onClick={() => setDetailModal({ isOpen: false, item: null })}
                    className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
                  >
                    {detailModal.item.lien_action}
                  </a>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setDetailModal({ isOpen: false, item: null })}>
                  Fermer
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
