import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Download, Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import { documentService } from '../services/documentService';
import type { Document } from '../types';

const typeLabels: Record<string, string> = {
  CNI: 'CNI',
  PASSEPORT: 'Passeport',
  STATUTS: 'Statuts',
  RCCM: 'RCCM',
  PATENTE: 'Patente',
  QUITTANCE: 'Quittance',
  AVATAR: 'Photo',
  AUTRE: 'Autre',
};

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null);

  const fetchDocuments = useCallback(async (page = 1, perPage = 20, q = '') => {
    setLoading(true);
    try {
      const res = await documentService.list({ page, per_page: perPage, search: q });
      const items = Array.isArray(res) ? res : (res as unknown as { data: Document[] }).data ?? [];
      setDocuments(items);
      const p = (res as unknown as { current_page: number; last_page: number; total: number; per_page: number });
      setPagination({
        currentPage: p.current_page ?? 1,
        lastPage: p.last_page ?? 1,
        total: p.total ?? 0,
        perPage: p.per_page ?? 20,
      });
    } catch {
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchDocuments(1, pagination.perPage, value), 300);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await documentService.delete(confirmDelete.id);
      toast.success('Document supprimé');
      setConfirmDelete(null);
      fetchDocuments(pagination.currentPage, pagination.perPage, search);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns = [
    {
      key: 'type_document',
      label: 'Type',
      render: (item: Document) => (
        <Badge variant="info">{typeLabels[item.type_document] ?? item.type_document}</Badge>
      ),
    },
    {
      key: 'numero',
      label: 'Numéro',
      render: (item: Document) => (
        <span className="text-sm text-gray-700">{item.numero ?? '—'}</span>
      ),
    },
    {
      key: 'personne',
      label: 'Personne',
      render: (item: Document) => {
        const p = item.personne;
        const nom = p?.nom_complet ?? [p?.prenom, p?.nom].filter(Boolean).join(' ') ?? p?.denomination_sociale ?? '—';
        return <span className="text-sm text-gray-700">{nom}</span>;
      },
    },
    {
      key: 'est_valide',
      label: 'Statut',
      render: (item: Document) => (
        <Badge variant={item.est_valide ? 'success' : 'danger'}>{item.est_valide ? 'Valide' : 'Invalide'}</Badge>
      ),
    },
    {
      key: 'date_expiration',
      label: 'Expiration',
      render: (item: Document) => (
        <span className="text-sm text-gray-600">
          {item.date_expiration ? new Date(item.date_expiration).toLocaleDateString('fr-FR') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Document) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const token = localStorage.getItem('token');
              fetch(documentService.downloadUrl(item.id), { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
                .then((blob) => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = item.fichier.split('/').pop() ?? `document_${item.id}`;
                  document.body.appendChild(a);
                  a.click();
                  URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                })
                .catch(() => toast.error('Erreur lors du téléchargement'));
            }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Télécharger"
          >
            <Download size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(item); }}
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
      <PageHeader title="Documents" subtitle="Gestion des documents des opérateurs" />
      <DataTable
        columns={columns}
        data={documents}
        loading={loading}
        emptyMessage="Aucun document trouvé"
        searchable
        searchPlaceholder="Rechercher un document..."
        onSearch={handleSearch}
        pagination={{
          currentPage: pagination.currentPage,
          lastPage: pagination.lastPage,
          total: pagination.total,
          perPage: pagination.perPage,
          onPageChange: (page) => fetchDocuments(page, pagination.perPage, search),
          onPerPageChange: (perPage) => fetchDocuments(1, perPage, search),
        }}
      />
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer le document"
        message={`Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
