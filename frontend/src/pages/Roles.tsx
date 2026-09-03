import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Shield, Users, Key, Pencil, Trash2, Settings } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';
import { roleService } from '../services/roleService';
import { permissionService } from '../services/permissionService';
import type { Role, Permission, PaginatedResponse } from '../types';

export default function Roles() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Role | null });

  const fetchRoles = useCallback(async (page = 1, perPage = 20, q = '') => {
    setLoading(true);
    try {
      const res: PaginatedResponse<Role> = await roleService.list({ page, per_page: perPage, search: q });
      setRoles(res.data);
      setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
    } catch {
      toast.error('Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const data = await permissionService.all();
      setAllPermissions(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchRoles(1, pagination.perPage);
    fetchPermissions();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRoles(1, pagination.perPage, value), 300);
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await roleService.delete(confirmModal.item.id);
      toast.success('Rôle supprimé');
      setConfirmModal({ isOpen: false, item: null });
      fetchRoles(pagination.currentPage, pagination.perPage, search);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr.message || 'Erreur lors de la suppression');
    }
  };

  const permCount = (role: Role) => role.permissions?.length ?? 0;

  const columns = [
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (item: Role) => <span className="font-medium text-gray-800">{item.nom}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (item: Role) => <span className="text-sm text-gray-600">{item.description ?? '-'}</span>,
    },
    {
      key: 'permissions_count',
      label: 'Permissions',
      render: (item: Role) => <Badge variant="info">{permCount(item)}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Role) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/roles/${item.id}/modifier`); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer" title="Modifier">
            <Pencil size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, item }); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer" title="Supprimer">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rôles"
        subtitle="Gestion des rôles et permissions"
        actions={<Button icon={<Plus size={16} />} onClick={() => navigate('/roles/nouveau')}>Nouveau rôle</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Shield className="text-white" size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total rôles</p>
            <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
            <Key className="text-white" size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total permissions</p>
            <p className="text-2xl font-bold text-slate-900">{allPermissions.length}</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        emptyMessage="Aucun rôle trouvé"
        onRowClick={(item) => navigate(`/roles/${item.id}/modifier`)}
        searchable
        searchPlaceholder="Rechercher un rôle..."
        onSearch={handleSearch}
        pagination={{
          currentPage: pagination.currentPage,
          lastPage: pagination.lastPage,
          total: pagination.total,
          perPage: pagination.perPage,
          onPageChange: (page) => fetchRoles(page, pagination.perPage, search),
          onPerPageChange: (perPage) => fetchRoles(1, perPage, search),
        }}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Supprimer"
        message={`Supprimer le rôle "${confirmModal.item?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
