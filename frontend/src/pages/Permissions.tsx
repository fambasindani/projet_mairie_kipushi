import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Key, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { permissionService } from '../services/permissionService';
import type { Permission, PaginatedResponse } from '../types';

interface PermForm {
  nom: string;
  ressource: string;
  action: string;
  description: string;
}

const EMPTY_FORM: PermForm = { nom: '', ressource: '', action: '', description: '' };

const actionOptions = [
  { label: 'create', value: 'create' },
  { label: 'read', value: 'read' },
  { label: 'update', value: 'update' },
  { label: 'delete', value: 'delete' },
];

export default function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const [ressourceFilter, setRessourceFilter] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formModal, setFormModal] = useState({ isOpen: false, isEdit: false, editId: 0 });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Permission | null });
  const [form, setForm] = useState<PermForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchPermissions = useCallback(async (page = 1, perPage = 20, q = '', res = '') => {
    setLoading(true);
    try {
      const res_: PaginatedResponse<Permission> = await permissionService.list({
        page, per_page: perPage, search: q || undefined, ressource: res || undefined,
      });
      setPermissions(res_.data);
      setPagination({ currentPage: res_.current_page, lastPage: res_.last_page, total: res_.total, perPage: res_.per_page });
    } catch {
      toast.error('Erreur lors du chargement des permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPermissions(1, pagination.perPage, search, ressourceFilter); }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPermissions(1, pagination.perPage, value, ressourceFilter), 300);
  };

  const handleRessourceFilter = (value: string) => {
    setRessourceFilter(value);
    fetchPermissions(1, pagination.perPage, search, value);
  };

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setErrors({}); setFormModal({ isOpen: true, isEdit: false, editId: 0 }); };
  const openEdit = (item: Permission) => { setForm({ nom: item.nom, ressource: item.ressource, action: item.action, description: item.description ?? '' }); setErrors({}); setFormModal({ isOpen: true, isEdit: true, editId: item.id }); };
  const openDelete = (item: Permission) => setConfirmModal({ isOpen: true, item });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!form.nom.trim()) e.nom = 'Le nom est requis';
    if (!form.ressource.trim()) e.ressource = 'La ressource est requise';
    if (!form.action.trim()) e.action = 'L\'action est requise';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      if (formModal.isEdit) {
        await permissionService.update(formModal.editId, form);
        toast.success('Permission modifiée');
      } else {
        await permissionService.create(form);
        toast.success('Permission créée');
      }
      setFormModal({ isOpen: false, isEdit: false, editId: 0 });
      fetchPermissions(pagination.currentPage, pagination.perPage, search, ressourceFilter);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const fe: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, v]) => { fe[k] = v[0]; });
        setErrors(fe);
      } else {
        toast.error(apiErr.message || 'Erreur');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await permissionService.delete(confirmModal.item.id);
      toast.success('Permission supprimée');
      setConfirmModal({ isOpen: false, item: null });
      fetchPermissions(pagination.currentPage, pagination.perPage, search, ressourceFilter);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns = [
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (item: Permission) => <span className="font-medium text-gray-800">{item.nom}</span>,
    },
    {
      key: 'ressource',
      label: 'Ressource',
      render: (item: Permission) => <Badge variant="info">{item.ressource}</Badge>,
    },
    {
      key: 'action',
      label: 'Action',
      render: (item: Permission) => {
        const colors: Record<string, 'success' | 'info' | 'warning' | 'danger'> = { create: 'success', read: 'info', update: 'warning', delete: 'danger' };
        return <Badge variant={colors[item.action] ?? 'info'}>{item.action}</Badge>;
      },
    },
    {
      key: 'description',
      label: 'Description',
      render: (item: Permission) => <span className="text-sm text-gray-600">{item.description ?? '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Permission) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(item); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer" title="Modifier">
            <Pencil size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openDelete(item); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer" title="Supprimer">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        subtitle="Gestion des permissions du système"
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>Nouvelle permission</Button>}
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher une permission..." value={search} onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
        </div>
        <Select options={[{ label: 'Toutes les ressources', value: '' }, ...[...new Set(permissions.map((p) => p.ressource))].sort().map((r) => ({ label: r, value: r }))]} value={ressourceFilter} onChange={(e) => handleRessourceFilter(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        data={permissions}
        loading={loading}
        emptyMessage="Aucune permission trouvée"
        searchable={false}
        pagination={{
          currentPage: pagination.currentPage,
          lastPage: pagination.lastPage,
          total: pagination.total,
          perPage: pagination.perPage,
          onPageChange: (page) => fetchPermissions(page, pagination.perPage, search, ressourceFilter),
          onPerPageChange: (perPage) => fetchPermissions(1, perPage, search, ressourceFilter),
        }}
      />

      <Modal isOpen={formModal.isOpen} onClose={() => setFormModal({ isOpen: false, isEdit: false, editId: 0 })} title={formModal.isEdit ? 'Modifier la permission' : 'Nouvelle permission'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nom *" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} error={errors.nom} placeholder="Ex: operateur:create" />
            <Input label="Ressource *" value={form.ressource} onChange={(e) => setForm((p) => ({ ...p, ressource: e.target.value }))} error={errors.ressource} placeholder="Ex: operateur" />
            <Select label="Action *" options={actionOptions} value={form.action} onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))} error={errors.action} />
            <Input label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} error={errors.description} placeholder="Description..." />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setFormModal({ isOpen: false, isEdit: false, editId: 0 })}>Annuler</Button>
            <Button type="submit" loading={submitting}>{formModal.isEdit ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, item: null })} onConfirm={handleDelete} title="Supprimer" message={`Supprimer la permission "${confirmModal.item?.nom}" ?`} confirmText="Supprimer" variant="danger" />
    </div>
  );
}
