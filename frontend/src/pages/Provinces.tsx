import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  MapPin,
  CheckCircle,
  Building2,
  ChevronRight,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { provinceService } from '../services/provinceService';
import type { Province, Ville, PaginatedResponse } from '../types';

interface ProvinceForm {
  code: string;
  nom: string;
}

const EMPTY_FORM: ProvinceForm = {
  code: '',
  nom: '',
};

export default function Provinces() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formModal, setFormModal] = useState({ isOpen: false, isEdit: false, editId: 0 });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Province | null });
  const [form, setForm] = useState<ProvinceForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [villesModal, setVillesModal] = useState({ isOpen: false, province: null as Province | null, villes: [] as Ville[], loading: false });

  const [stats, setStats] = useState({ total: 0, actives: 0, totalVilles: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchProvinces = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Province> = await provinceService.list({ page, per_page: perPage, search: q });
        setProvinces(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des provinces');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await provinceService.list({ per_page: 9999 });
      const all = res.data;
      const actives = all.filter((p) => p.est_actif).length;
      setStats({ total: res.total, actives, totalVilles: 0 });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProvinces(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProvinces(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchProvinces(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchProvinces(1, perPage, search);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: false, editId: 0 });
  };

  const openEdit = (item: Province) => {
    setForm({ code: item.code, nom: item.nom });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: true, editId: item.id });
  };

  const openDelete = (item: Province) => setConfirmModal({ isOpen: true, item });

  const handleToggle = async (item: Province) => {
    try {
      await provinceService.update(item.id, { est_actif: !item.est_actif });
      toast.success(item.est_actif ? 'Province désactivée' : 'Province activée');
      fetchProvinces(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await provinceService.delete(confirmModal.item.id);
      toast.success('Province supprimée');
      setConfirmModal({ isOpen: false, item: null });
      fetchProvinces(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openVilles = async (item: Province) => {
    setVillesModal({ isOpen: true, province: item, villes: [], loading: true });
    try {
      const res = await provinceService.list({ per_page: 9999 });
      setVillesModal((prev) => ({ ...prev, villes: [], loading: false }));
    } catch {
      toast.error('Erreur lors du chargement des villes');
      setVillesModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Le code est requis';
    if (!form.nom.trim()) e.nom = 'Le nom est requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { code: form.code, nom: form.nom };

      if (formModal.isEdit) {
        await provinceService.update(formModal.editId, payload);
        toast.success('Province modifiée');
      } else {
        await provinceService.create(payload);
        toast.success('Province créée');
      }
      setFormModal({ isOpen: false, isEdit: false, editId: 0 });
      fetchProvinces(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, v]) => { fieldErrors[k] = v[0]; });
        setErrors(fieldErrors);
      } else {
        toast.error(apiErr.message || 'Erreur lors de la soumission');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (item: Province) => (
        <span className="font-mono text-sm font-medium text-indigo-600">{item.code}</span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (item: Province) => (
        <span className="font-medium text-slate-900">{item.nom}</span>
      ),
    },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: Province) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>
          {item.est_actif ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Province) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Modifier"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(item); }}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
            title="Basculer actif"
          >
            <ToggleLeft size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openDelete(item); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
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
        title="Provinces"
        subtitle="Gestion des provinces"
        actions={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Nouvelle province
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total provinces" value={stats.total} icon={<MapPin size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Actives" value={stats.actives} icon={<CheckCircle size={22} />} color="success" loading={statsLoading} />
        <StatCard title="Total villes" value={stats.totalVilles} icon={<Building2 size={22} />} color="info" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={provinces}
        loading={loading}
        emptyMessage="Aucune province trouvée"
        searchable
        searchPlaceholder="Rechercher une province..."
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

      <Modal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, isEdit: false, editId: 0 })}
        title={formModal.isEdit ? 'Modifier la province' : 'Nouvelle province'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Code *"
            value={form.code}
            onChange={(e) => setField('code', e.target.value)}
            error={errors.code}
            placeholder="PROV-001"
          />
          <Input
            label="Nom *"
            value={form.nom}
            onChange={(e) => setField('nom', e.target.value)}
            error={errors.nom}
            placeholder="Nom de la province"
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setFormModal({ isOpen: false, isEdit: false, editId: 0 })}
            >
              Annuler
            </Button>
            <Button type="submit" loading={submitting}>
              {formModal.isEdit ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Supprimer"
        message={`Êtes-vous sûr de vouloir supprimer la province "${confirmModal.item?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
