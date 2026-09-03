import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  Building2,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DropdownSearch from '../components/ui/DropdownSearch';
import { villeService } from '../services/villeService';
import { provinceService } from '../services/provinceService';
import type { Ville, Province, PaginatedResponse } from '../types';

interface VilleForm {
  code: string;
  nom: string;
  id_province: number | null;
}

const EMPTY_FORM: VilleForm = {
  code: '',
  nom: '',
  id_province: null,
};

export default function Villes() {
  const [villes, setVilles] = useState<Ville[]>([]);
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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Ville | null });
  const [form, setForm] = useState<VilleForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [stats, setStats] = useState({ total: 0, actives: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    provinceService.list({ per_page: 100 }).then((res) => setProvinces(res.data));
  }, []);

  const fetchVilles = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Ville> = await villeService.list({ page, per_page: perPage, search: q });
        setVilles(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des villes');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await villeService.list({ per_page: 9999 });
      const all = res.data;
      const actives = all.filter((v) => v.est_actif).length;
      setStats({ total: res.total, actives });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVilles(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchVilles(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchVilles(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchVilles(1, perPage, search);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: false, editId: 0 });
  };

  const openEdit = (item: Ville) => {
    setForm({ code: item.code, nom: item.nom, id_province: item.id_province ?? null });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: true, editId: item.id });
  };

  const openDelete = (item: Ville) => setConfirmModal({ isOpen: true, item });

  const handleToggle = async (item: Ville) => {
    try {
      await villeService.update(item.id, { est_actif: !item.est_actif });
      toast.success(item.est_actif ? 'Ville désactivée' : 'Ville activée');
      fetchVilles(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await villeService.delete(confirmModal.item.id);
      toast.success('Ville supprimée');
      setConfirmModal({ isOpen: false, item: null });
      fetchVilles(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
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
      const payload: Record<string, unknown> = {
        code: form.code,
        nom: form.nom,
        id_province: form.id_province,
      };

      if (formModal.isEdit) {
        await villeService.update(formModal.editId, payload);
        toast.success('Ville modifiée');
      } else {
        await villeService.create(payload);
        toast.success('Ville créée');
      }
      setFormModal({ isOpen: false, isEdit: false, editId: 0 });
      fetchVilles(pagination.currentPage, pagination.perPage, search);
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

  const setField = (field: string, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const provinceOptions = provinces.map((p) => ({ label: p.nom, value: p.id }));

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (item: Ville) => (
        <span className="font-mono text-sm font-medium text-indigo-600">{item.code}</span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (item: Ville) => (
        <span className="font-medium text-slate-900">{item.nom}</span>
      ),
    },
    {
      key: 'province',
      label: 'Province',
      render: (item: Ville) => (
        <span className="text-sm text-slate-600">{item.province?.nom ?? '—'}</span>
      ),
    },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: Ville) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>
          {item.est_actif ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Ville) => (
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
        title="Villes"
        subtitle="Gestion des villes"
        actions={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Nouvelle ville
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total villes" value={stats.total} icon={<Building2 size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Actives" value={stats.actives} icon={<CheckCircle size={22} />} color="success" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={villes}
        loading={loading}
        emptyMessage="Aucune ville trouvée"
        searchable
        searchPlaceholder="Rechercher une ville..."
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
        title={formModal.isEdit ? 'Modifier la ville' : 'Nouvelle ville'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <DropdownSearch
            label="Province"
            options={provinceOptions}
            value={form.id_province ?? ''}
            onChange={(val) => setField('id_province', val ? Number(val) : null)}
            placeholder="Sélectionner une province..."
          />
          <Input
            label="Code *"
            value={form.code}
            onChange={(e) => setField('code', e.target.value)}
            error={errors.code}
            placeholder="VILLE-001"
          />
          <Input
            label="Nom *"
            value={form.nom}
            onChange={(e) => setField('nom', e.target.value)}
            error={errors.nom}
            placeholder="Nom de la ville"
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
        message={`Êtes-vous sûr de vouloir supprimer la ville "${confirmModal.item?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
