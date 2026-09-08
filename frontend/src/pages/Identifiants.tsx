import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Trash2, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DropdownSearch from '../components/ui/DropdownSearch';
import { get, post, del } from '../services/api';
import type { PaginatedResponse } from '../types';

interface Identifiant {
  id: number;
  personne_id: number;
  type_identifiant: string;
  valeur: string;
  province_delivrance: string | null;
  date_delivrance: string | null;
  date_expiration: string | null;
  est_actif: boolean;
  personne?: { id: number; nom: string; prenom: string; denomination_sociale: string | null };
  created_at: string;
}

const typeLabels: Record<string, string> = {
  RCCM: 'RCCM',
  IDNAT: 'ID NAT',
  NUMERO_IMPOT: 'N° Impôt',
  NIF: 'NIF',
  CNSS: 'CNSS',
  ONEM: 'ONEM',
  PASSEPORT: 'Passeport',
  PERMIS_CONDURE: 'Permis de conduire',
};

export default function Identifiants() {
  const navigate = useNavigate();
  const [data, setData] = useState<Identifiant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Identifiant | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ personne_id: '', type_identifiant: 'RCCM', valeur: '', province_delivrance: '', date_delivrance: '', date_expiration: '' });

  const [personnes, setPersonnes] = useState<{ value: number; label: string }[]>([]);
  const [loadingPersonnes, setLoadingPersonnes] = useState(false);

  const fetchData = useCallback(async (page = 1, perPage = 20, q = '') => {
    setLoading(true);
    try {
      const res: PaginatedResponse<Identifiant> = await get('/identifiants', { page, per_page: perPage, search: q });
      setData(res.data);
      setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const loadPersonnes = async () => {
    setLoadingPersonnes(true);
    try {
      const res = await get<{ data: { id: number; nom: string; prenom: string; denomination_sociale: string | null }[] }>('/personnes', { per_page: 200 });
      const items = (res.data ?? []).map((p) => ({ value: p.id, label: p.prenom ? `${p.prenom} ${p.nom}` : p.denomination_sociale ?? p.nom }));
      setPersonnes(items);
    } catch { setPersonnes([]); }
    finally { setLoadingPersonnes(false); }
  };

  const openForm = () => {
    setForm({ personne_id: '', type_identifiant: 'RCCM', valeur: '', province_delivrance: '', date_delivrance: '', date_expiration: '' });
    setFormErrors({});
    setFormOpen(true);
    loadPersonnes();
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!form.personne_id) errors.personne_id = 'L\'opérateur est requis';
    if (!form.valeur.trim()) errors.valeur = 'La valeur est requise';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setFormErrors({});
    setSubmitting(true);
    try {
      await post('/identifiants', {
        personne_id: Number(form.personne_id),
        type_identifiant: form.type_identifiant,
        valeur: form.valeur,
        province_delivrance: form.province_delivrance || undefined,
        date_delivrance: form.date_delivrance || undefined,
        date_expiration: form.date_expiration || undefined,
      });
      toast.success('Identifiant créé');
      setFormOpen(false);
      fetchData(1, pagination.perPage, search);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const firstKey = Object.keys(apiErr.errors)[0];
        toast.error(apiErr.errors[firstKey][0]);
      } else {
        toast.error(apiErr.message || 'Erreur lors de la création');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(1, pagination.perPage, value), 300);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await del(`/identifiants/${confirmDelete.id}`);
      toast.success('Identifiant supprimé');
      setConfirmDelete(null);
      fetchData(pagination.currentPage, pagination.perPage, search);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns = [
    {
      key: 'type_identifiant',
      label: 'Type',
      render: (item: Identifiant) => (
        <Badge variant="info">{typeLabels[item.type_identifiant] ?? item.type_identifiant}</Badge>
      ),
    },
    {
      key: 'valeur',
      label: 'Valeur',
      render: (item: Identifiant) => (
        <span className="font-mono text-sm font-medium text-gray-800">{item.valeur}</span>
      ),
    },
    {
      key: 'personne',
      label: 'Personne',
      render: (item: Identifiant) => {
        const p = item.personne;
        const nom = p ? [p.prenom, p.nom].filter(Boolean).join(' ') ?? p.denomination_sociale ?? '—' : '—';
        return <span className="text-sm text-gray-700">{nom}</span>;
      },
    },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: Identifiant) => (
        <Badge variant={item.est_actif ? 'success' : 'danger'}>{item.est_actif ? 'Actif' : 'Inactif'}</Badge>
      ),
    },
    {
      key: 'date_expiration',
      label: 'Expiration',
      render: (item: Identifiant) => (
        <span className="text-sm text-gray-600">
          {item.date_expiration ? new Date(item.date_expiration).toLocaleDateString('fr-FR') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Identifiant) => (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(item); }}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Identifiants officiels" subtitle="Gestion des identifiants des opérateurs"
        actions={<Button icon={<Plus size={16} />} onClick={openForm}>Nouvel identifiant</Button>}
      />
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="Aucun identifiant trouvé"
        searchable
        searchPlaceholder="Rechercher..."
        onSearch={handleSearch}
        onRowClick={(item) => navigate(`/identifiants/${item.id}`)}
        pagination={{
          currentPage: pagination.currentPage,
          lastPage: pagination.lastPage,
          total: pagination.total,
          perPage: pagination.perPage,
          onPageChange: (page) => fetchData(page, pagination.perPage, search),
          onPerPageChange: (perPage) => fetchData(1, perPage, search),
        }}
      />
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Nouvel identifiant" size="lg">
        <div className="space-y-4">
          <DropdownSearch
            label="Opérateur *"
            options={personnes}
            value={form.personne_id}
            onChange={(v) => { setForm((p) => ({ ...p, personne_id: String(v) })); if (formErrors.personne_id) setFormErrors((p) => ({ ...p, personne_id: '' })); }}
            placeholder="Rechercher un opérateur..."
            loading={loadingPersonnes}
            error={formErrors.personne_id}
          />
          <Select label="Type *" options={Object.entries(typeLabels).map(([value, label]) => ({ label, value }))} value={form.type_identifiant} onChange={(e) => setForm((p) => ({ ...p, type_identifiant: e.target.value }))} />
          <Input label="Numéro / Valeur *" value={form.valeur} onChange={(e) => { setForm((p) => ({ ...p, valeur: e.target.value })); if (formErrors.valeur) setFormErrors((p) => ({ ...p, valeur: '' })); }} placeholder="Ex: 012345678" error={formErrors.valeur} />
          <Input label="Province de délivrance" value={form.province_delivrance} onChange={(e) => setForm((p) => ({ ...p, province_delivrance: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date de délivrance" type="date" value={form.date_delivrance} onChange={(e) => setForm((p) => ({ ...p, date_delivrance: e.target.value }))} />
            <Input label="Date d'expiration" type="date" value={form.date_expiration} onChange={(e) => setForm((p) => ({ ...p, date_expiration: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting} icon={<Plus size={14} />}>Créer</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer l'identifiant"
        message="Êtes-vous sûr de vouloir supprimer cet identifiant ? Cette action est irréversible."
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
