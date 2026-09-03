import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Shield, Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import { get, del } from '../services/api';
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
  const [data, setData] = useState<Identifiant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Identifiant | null>(null);

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
      <PageHeader title="Identifiants officiels" subtitle="Gestion des identifiants des opérateurs" />
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="Aucun identifiant trouvé"
        searchable
        searchPlaceholder="Rechercher..."
        onSearch={handleSearch}
        pagination={{
          currentPage: pagination.currentPage,
          lastPage: pagination.lastPage,
          total: pagination.total,
          perPage: pagination.perPage,
          onPageChange: (page) => fetchData(page, pagination.perPage, search),
          onPerPageChange: (perPage) => fetchData(1, perPage, search),
        }}
      />
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
