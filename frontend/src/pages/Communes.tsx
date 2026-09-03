import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  MapPin,
  CheckCircle,
  Users,
  ChevronRight,
  X,
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
import { communeService } from '../services/communeService';
import { villeService } from '../services/villeService';
import type { Commune, Quartier, Ville, PaginatedResponse } from '../types';
import Skeleton from 'react-loading-skeleton';

interface CommuneForm {
  code: string;
  nom: string;
  id_ville: number | null;
}

const EMPTY_FORM: CommuneForm = {
  code: '',
  nom: '',
  id_ville: null,
};

export default function Communes() {
  const [communes, setCommunes] = useState<Commune[]>([]);
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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Commune | null });
  const [form, setForm] = useState<CommuneForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [quartiersModal, setQuartiersModal] = useState({ isOpen: false, commune: null as Commune | null, quartiers: [] as Quartier[], loading: false });

  const [stats, setStats] = useState({ total: 0, actives: 0, totalQuartiers: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [villes, setVilles] = useState<Ville[]>([]);

  useEffect(() => {
    villeService.list({ per_page: 999 }).then((res) => setVilles(res.data));
  }, []);

  const fetchCommunes = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Commune> = await communeService.list({ page, per_page: perPage, search: q });
        setCommunes(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des communes');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await communeService.list({ per_page: 9999 });
      const all = res.data;
      const actives = all.filter((c) => c.est_actif).length;
      const totalQuartiers = all.reduce((sum, c) => sum + (c.quartiers?.length ?? 0), 0);
      setStats({ total: res.total, actives, totalQuartiers });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunes(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCommunes(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchCommunes(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchCommunes(1, perPage, search);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: false, editId: 0 });
  };

  const openEdit = (item: Commune) => {
    setForm({ code: item.code, nom: item.nom, id_ville: item.id_ville ?? null });
    setErrors({});
    setFormModal({ isOpen: true, isEdit: true, editId: item.id });
  };

  const openDelete = (item: Commune) => setConfirmModal({ isOpen: true, item });

  const handleToggle = async (item: Commune) => {
    try {
      await communeService.update(item.id, { est_actif: !item.est_actif });
      toast.success(item.est_actif ? 'Commune désactivée' : 'Commune activée');
      fetchCommunes(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await communeService.delete(confirmModal.item.id);
      toast.success('Commune supprimée');
      setConfirmModal({ isOpen: false, item: null });
      fetchCommunes(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openQuartiers = async (item: Commune) => {
    setQuartiersModal({ isOpen: true, commune: item, quartiers: [], loading: true });
    try {
      const data = await communeService.quartiers(item.id);
      setQuartiersModal((prev) => ({ ...prev, quartiers: data, loading: false }));
    } catch {
      toast.error('Erreur lors du chargement des quartiers');
      setQuartiersModal((prev) => ({ ...prev, loading: false }));
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
      const payload: Record<string, unknown> = { code: form.code, nom: form.nom, id_ville: form.id_ville };

      if (formModal.isEdit) {
        await communeService.update(formModal.editId, payload);
        toast.success('Commune modifiée');
      } else {
        await communeService.create(payload);
        toast.success('Commune créée');
      }
      setFormModal({ isOpen: false, isEdit: false, editId: 0 });
      fetchCommunes(pagination.currentPage, pagination.perPage, search);
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

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (item: Commune) => (
        <span className="font-mono text-sm font-medium text-primary-600">{item.code}</span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (item: Commune) => (
        <span className="font-medium text-gray-800">{item.nom}</span>
      ),
    },
    {
      key: 'ville',
      label: 'Ville',
      render: (item: Commune) => (
        <span className="text-sm text-gray-600">{item.ville?.nom ?? '—'}</span>
      ),
    },
    {
      key: 'quartiers',
      label: 'Quartiers',
      render: (item: Commune) => (
        <span className="text-sm text-gray-600">{item.quartiers?.length ?? 0}</span>
      ),
    },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: Commune) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>
          {item.est_actif ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Commune) => (
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
          <button
            onClick={(e) => { e.stopPropagation(); openQuartiers(item); }}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
            title="Voir quartiers"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communes"
        subtitle="Gestion des communes et quartiers"
        actions={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Nouvelle commune
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total communes" value={stats.total} icon={<MapPin size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Actives" value={stats.actives} icon={<CheckCircle size={22} />} color="success" loading={statsLoading} />
        <StatCard title="Total quartiers" value={stats.totalQuartiers} icon={<Users size={22} />} color="info" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={communes}
        loading={loading}
        emptyMessage="Aucune commune trouvée"
        searchable
        searchPlaceholder="Rechercher une commune..."
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
        title={formModal.isEdit ? 'Modifier la commune' : 'Nouvelle commune'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <DropdownSearch
            label="Ville"
            options={villes.map((v) => ({ label: v.nom, value: v.id }))}
            value={form.id_ville ?? ''}
            onChange={(val) => setField('id_ville', val ? Number(val) : null)}
            placeholder="Sélectionner une ville..."
          />
          <Input
            label="Code *"
            value={form.code}
            onChange={(e) => setField('code', e.target.value)}
            error={errors.code}
            placeholder="COM-001"
          />
          <Input
            label="Nom *"
            value={form.nom}
            onChange={(e) => setField('nom', e.target.value)}
            error={errors.nom}
            placeholder="Nom de la commune"
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
        message={`Êtes-vous sûr de vouloir supprimer la commune "${confirmModal.item?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />

      <Modal
        isOpen={quartiersModal.isOpen}
        onClose={() => setQuartiersModal({ isOpen: false, commune: null, quartiers: [], loading: false })}
        title={`Quartiers de ${quartiersModal.commune?.nom ?? ''}`}
        size="lg"
      >
        {quartiersModal.loading ? (
          <div className="py-8">
            <Skeleton count={3} height={40} />
          </div>
        ) : quartiersModal.quartiers.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">Aucun quartier trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quartiersModal.quartiers.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">{q.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{q.nom}</td>
                    <td className="px-4 py-3">
                      <Badge variant={q.est_actif ? 'success' : 'danger'}>
                        {q.est_actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
