import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  Map,
  CheckCircle,
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
import { quartierService } from '../services/quartierService';
import { communeService } from '../services/communeService';
import type { Quartier, Commune, PaginatedResponse } from '../types';

interface QuartierForm {
  commune_id: string | number;
  code: string;
  nom: string;
}

const EMPTY_FORM: QuartierForm = {
  commune_id: '',
  code: '',
  nom: '',
};

export default function Quartiers() {
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Quartier | null });
  const [form, setForm] = useState<QuartierForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [communes, setCommunes] = useState<{ label: string; value: number }[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  const [stats, setStats] = useState({ total: 0, actifs: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchQuartiers = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Quartier> = await quartierService.list({ page, per_page: perPage, search: q });
        setQuartiers(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des quartiers');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await quartierService.list({ per_page: 9999 });
      const all = res.data;
      const actifs = all.filter((q) => q.est_actif).length;
      setStats({ total: res.total, actifs });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCommunes = useCallback(async () => {
    setLoadingCommunes(true);
    try {
      const res = await communeService.list({ per_page: 500 });
      setCommunes(res.data.map((c) => ({ label: c.nom, value: c.id })));
    } catch {
      // silently fail
    } finally {
      setLoadingCommunes(false);
    }
  }, []);

  useEffect(() => {
    fetchQuartiers(1, pagination.perPage, search);
    fetchStats();
    fetchCommunes();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchQuartiers(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchQuartiers(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchQuartiers(1, perPage, search);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: false, editId: 0 });
  };

  const openEdit = (item: Quartier) => {
    setForm({ commune_id: item.commune_id, code: item.code, nom: item.nom });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: true, editId: item.id });
  };

  const openDelete = (item: Quartier) => setConfirmModal({ isOpen: true, item });

  const handleToggle = async (item: Quartier) => {
    try {
      await quartierService.update(item.id, { est_actif: !item.est_actif });
      toast.success(item.est_actif ? 'Quartier désactivé' : 'Quartier activé');
      fetchQuartiers(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await quartierService.delete(confirmModal.item.id);
      toast.success('Quartier supprimé');
      setConfirmModal({ isOpen: false, item: null });
      fetchQuartiers(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.commune_id) e.commune_id = 'La commune est requise';
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
        commune_id: Number(form.commune_id),
        code: form.code,
        nom: form.nom,
      };

      if (formModal.isEdit) {
        await quartierService.update(formModal.editId, payload);
        toast.success('Quartier modifié');
      } else {
        await quartierService.create(payload);
        toast.success('Quartier créé');
      }
      setFormModal({ isOpen: false, isEdit: false, editId: 0 });
      fetchQuartiers(pagination.currentPage, pagination.perPage, search);
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

  const setField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (item: Quartier) => (
        <span className="font-mono text-sm font-medium text-primary-600">{item.code}</span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (item: Quartier) => (
        <span className="font-medium text-gray-800">{item.nom}</span>
      ),
    },
    {
      key: 'commune',
      label: 'Commune',
      render: (item: Quartier) => (
        <span className="text-sm text-gray-700">
          {item.commune?.nom ?? `#${item.commune_id}`}
        </span>
      ),
    },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: Quartier) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>
          {item.est_actif ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Quartier) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Modifier"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(item); }}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors cursor-pointer"
            title="Basculer actif"
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
        title="Quartiers"
        subtitle="Gestion des quartiers"
        actions={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Nouveau quartier
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total quartiers" value={stats.total} icon={<Map size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Actifs" value={stats.actifs} icon={<CheckCircle size={22} />} color="success" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={quartiers}
        loading={loading}
        emptyMessage="Aucun quartier trouvé"
        searchable
        searchPlaceholder="Rechercher un quartier..."
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
        title={formModal.isEdit ? 'Modifier le quartier' : 'Nouveau quartier'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <DropdownSearch
            label="Commune *"
            options={communes}
            value={form.commune_id}
            onChange={(val) => setField('commune_id', val)}
            placeholder="Sélectionner une commune..."
            loading={loadingCommunes}
            error={errors.commune_id}
          />
          <Input
            label="Code *"
            value={form.code}
            onChange={(e) => setField('code', e.target.value)}
            error={errors.code}
            placeholder="QRT-001"
          />
          <Input
            label="Nom *"
            value={form.nom}
            onChange={(e) => setField('nom', e.target.value)}
            error={errors.nom}
            placeholder="Nom du quartier"
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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
        message={`Êtes-vous sûr de vouloir supprimer le quartier "${confirmModal.item?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
