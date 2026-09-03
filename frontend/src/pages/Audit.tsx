import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye,
  Shield,
  Search,
  Filter,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Select from '../components/ui/Select';
import { auditService } from '../services/auditService';
import type { LogAudit, PaginatedResponse } from '../types';

const actionBadge: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  LOGIN: 'warning',
  LOGOUT: 'neutral',
  TOGGLE: 'warning',
};

export default function Audit() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');

  const [stats, setStats] = useState({ total: 0, today: 0, tables: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchLogs = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        let res: PaginatedResponse<LogAudit>;
        if (filterAction) {
          res = await auditService.parAction(filterAction, { page, per_page: perPage, search: q });
        } else if (filterTable) {
          res = await auditService.parTable(filterTable, { page, per_page: perPage, search: q });
        } else {
          res = await auditService.list({ page, per_page: perPage, search: q });
        }
        setLogs(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des logs d\'audit');
      } finally {
        setLoading(false);
      }
    },
    [filterAction, filterTable]
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await auditService.list({ per_page: 9999 });
      const all = res.data;
      const today = new Date().toISOString().split('T')[0];
      const todayCount = all.filter((l) => l.created_at.startsWith(today)).length;
      const tableSet = new Set(all.map((l) => l.table_cible));
      setStats({ total: res.total, today: todayCount, tables: tableSet.size });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1, pagination.perPage, search);
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs(1, pagination.perPage, search);
  }, [filterAction, filterTable]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLogs(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchLogs(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchLogs(1, perPage, search);

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (item: LogAudit) => (
        <span className="text-sm text-gray-700">
          {new Date(item.created_at).toLocaleDateString('fr-FR', {
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
      key: 'utilisateur',
      label: 'Utilisateur',
      render: (item: LogAudit) => (
        <span className="text-sm text-gray-700">
          {item.utilisateur?.nom_utilisateur ?? `#${item.utilisateur_id ?? '—'}`}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (item: LogAudit) => (
        <Badge variant={actionBadge[item.action] ?? 'neutral'}>
          {item.action}
        </Badge>
      ),
    },
    {
      key: 'table_cible',
      label: 'Table cible',
      render: (item: LogAudit) => (
        <span className="font-mono text-sm text-gray-600">{item.table_cible}</span>
      ),
    },
    {
      key: 'adresse_ip',
      label: 'IP',
      render: (item: LogAudit) => (
        <span className="text-sm text-gray-500">{item.adresse_ip ?? '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: LogAudit) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/audit/${item.id}`); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Voir détail"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit"
        subtitle="Journal d'audit du système"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total logs" value={stats.total} icon={<Shield size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Aujourd'hui" value={stats.today} icon={<Search size={22} />} color="info" loading={statsLoading} />
        <StatCard title="Tables" value={stats.tables} icon={<Filter size={22} />} color="warning" loading={statsLoading} />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-48">
          <Select
            options={[
              { label: 'Toutes les actions', value: '' },
              { label: 'CREATE', value: 'CREATE' },
              { label: 'UPDATE', value: 'UPDATE' },
              { label: 'DELETE', value: 'DELETE' },
              { label: 'LOGIN', value: 'LOGIN' },
              { label: 'LOGOUT', value: 'LOGOUT' },
              { label: 'TOGGLE', value: 'TOGGLE' },
            ]}
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setFilterTable(''); }}
            placeholder="Action"
          />
        </div>
        <div className="w-48">
          <Select
            options={[
              { label: 'Toutes les tables', value: '' },
              { label: 'Personnes', value: 'personnes' },
              { label: 'Utilisateurs', value: 'utilisateurs' },
              { label: 'Taxes', value: 'taxes' },
              { label: 'Véhicules', value: 'vehicules' },
              { label: 'Permis', value: 'permis' },
              { label: 'Communes', value: 'communes' },
              { label: 'Quartiers', value: 'quartiers' },
              { label: 'Activités', value: 'activites' },
            ]}
            value={filterTable}
            onChange={(e) => { setFilterTable(e.target.value); setFilterAction(''); }}
            placeholder="Table"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="Aucun log d'audit trouvé"
        searchable
        searchPlaceholder="Rechercher un log..."
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
    </div>
  );
}
