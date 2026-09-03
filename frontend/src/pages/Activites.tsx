import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  Briefcase,
  CheckCircle,
  Layers,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { activiteService } from '../services/activiteService';
import type { ActiviteEconomique, PaginatedResponse } from '../types';

interface ActiviteForm {
  code: string;
  nom: string;
  secteur: string;
  description: string;
}

const EMPTY_FORM: ActiviteForm = {
  code: '',
  nom: '',
  secteur: '',
  description: '',
};

export default function Activites() {
  const [activites, setActivites] = useState<ActiviteEconomique[]>([]);
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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as ActiviteEconomique | null });
  const [form, setForm] = useState<ActiviteForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [stats, setStats] = useState({ total: 0, actives: 0, secteurs: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchActivites = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<ActiviteEconomique> = await activiteService.list({ page, per_page: perPage, search: q });
        setActivites(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des activités');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await activiteService.list({ per_page: 9999 });
      const all = res.data;
      const actives = all.filter((a) => a.est_actif).length;
      const secteurSet = new Set(all.map((a) => a.secteur).filter(Boolean));
      setStats({ total: res.total, actives, secteurs: secteurSet.size });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivites(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchActivites(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchActivites(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchActivites(1, perPage, search);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: false, editId: 0 });
  };

  const openEdit = (item: ActiviteEconomique) => {
    setForm({
      code: item.code,
      nom: item.nom,
      secteur: item.secteur ?? '',
      description: item.description ?? '',
    });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: true, editId: item.id });
  };

  const openDelete = (item: ActiviteEconomique) => setConfirmModal({ isOpen: true, item });

  const handleToggle = async (item: ActiviteEconomique) => {
    try {
      await activiteService.update(item.id, { est_actif: !item.est_actif });
      toast.success(item.est_actif ? 'Activité désactivée' : 'Activité activée');
      fetchActivites(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await activiteService.delete(confirmModal.item.id);
      toast.success('Activité supprimée');
      setConfirmModal({ isOpen: false, item: null });
      fetchActivites(pagination.currentPage, pagination.perPage, search);
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
        secteur: form.secteur || null,
        description: form.description || null,
      };

      if (formModal.isEdit) {
        await activiteService.update(formModal.editId, payload);
        toast.success('Activité modifiée');
      } else {
        await activiteService.create(payload);
        toast.success('Activité créée');
      }
      setFormModal({ isOpen: false, isEdit: false, editId: 0 });
      fetchActivites(pagination.currentPage, pagination.perPage, search);
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

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + '...' : str;

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (item: ActiviteEconomique) => (
        <span className="font-mono text-sm font-medium text-primary-600">{item.code}</span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (item: ActiviteEconomique) => (
        <span className="font-medium text-gray-800">{item.nom}</span>
      ),
    },
    {
      key: 'secteur',
      label: 'Secteur',
      render: (item: ActiviteEconomique) => (
        <span className="text-sm text-gray-600">{item.secteur ?? '-'}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (item: ActiviteEconomique) => (
        <span className="text-sm text-gray-600" title={item.description ?? ''}>
          {item.description ? truncate(item.description, 60) : '-'}
        </span>
      ),
    },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: ActiviteEconomique) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>
          {item.est_actif ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: ActiviteEconomique) => (
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
        title="Activités économiques"
        subtitle="Gestion des activités économiques"
        actions={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Nouvelle activité
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total activités" value={stats.total} icon={<Briefcase size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Actives" value={stats.actives} icon={<CheckCircle size={22} />} color="success" loading={statsLoading} />
        <StatCard title="Secteurs" value={stats.secteurs} icon={<Layers size={22} />} color="info" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={activites}
        loading={loading}
        emptyMessage="Aucune activité trouvée"
        searchable
        searchPlaceholder="Rechercher une activité..."
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
        title={formModal.isEdit ? 'Modifier l\'activité' : 'Nouvelle activité'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Code *"
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
              error={errors.code}
              placeholder="ACT-001"
            />
            <Input
              label="Nom *"
              value={form.nom}
              onChange={(e) => setField('nom', e.target.value)}
              error={errors.nom}
              placeholder="Nom de l'activité"
            />
            <Input
              label="Secteur"
              value={form.secteur}
              onChange={(e) => setField('secteur', e.target.value)}
              error={errors.secteur}
              placeholder="Commerce, Agriculture..."
            />
          </div>
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            error={errors.description}
            placeholder="Description de l'activité..."
            rows={3}
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
        message={`Êtes-vous sûr de vouloir supprimer l'activité "${confirmModal.item?.nom}" (${confirmModal.item?.code}) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
