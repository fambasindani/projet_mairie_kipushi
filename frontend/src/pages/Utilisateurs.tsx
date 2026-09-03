import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Pencil, Trash2, ToggleLeft } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { utilisateurService } from '../services/utilisateurService';
import type { Utilisateur, PaginatedResponse } from '../types';

export default function Utilisateurs() {
  const navigate = useNavigate();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Utilisateur | null });

  const fetchUtilisateurs = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Utilisateur> = await utilisateurService.list({
          page,
          per_page: perPage,
          search: q,
        });
        setUtilisateurs(res.data);
        setPagination({
          currentPage: res.current_page,
          lastPage: res.last_page,
          total: res.total,
          perPage: res.per_page,
        });
      } catch {
        toast.error('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchUtilisateurs(1, pagination.perPage, search);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUtilisateurs(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => {
    fetchUtilisateurs(page, pagination.perPage, search);
  };

  const handlePerPageChange = (perPage: number) => {
    fetchUtilisateurs(1, perPage, search);
  };

  const openDelete = (item: Utilisateur) => {
    setConfirmModal({ isOpen: true, item });
  };

  const handleToggle = async (item: Utilisateur) => {
    try {
      await utilisateurService.update(item.id, {
        est_actif: !item.est_actif,
      });
      toast.success(item.est_actif ? 'Utilisateur désactivé' : 'Utilisateur activé');
      fetchUtilisateurs(pagination.currentPage, pagination.perPage, search);
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.item) return;
    try {
      await utilisateurService.delete(confirmModal.item.id);
      toast.success('Utilisateur supprimé');
      setConfirmModal({ isOpen: false, item: null });
      fetchUtilisateurs(pagination.currentPage, pagination.perPage, search);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns = [
    {
      key: 'nom_utilisateur',
      label: "Nom d'utilisateur",
      sortable: true,
      render: (item: Utilisateur) => (
        <span className="font-medium text-gray-800">{item.nom_utilisateur}</span>
      ),
    },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'est_actif',
      label: 'Statut',
      render: (item: Utilisateur) => (
        <Badge variant={item.est_verrouille ? 'danger' : item.est_actif ? 'success' : 'neutral'}>
          {item.est_verrouille ? 'Verrouillé' : item.est_actif ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'derniere_connexion',
      label: 'Dernière connexion',
      render: (item: Utilisateur) =>
        item.derniere_connexion
          ? new Date(item.derniere_connexion).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—',
    },
    {
      key: 'roles',
      label: 'Rôles',
      render: (item: Utilisateur) => (
        <div className="flex flex-wrap gap-1">
          {item.roles && item.roles.length > 0 ? (
            item.roles.map((role) => (
              <Badge key={role.id} variant="info">
                {role.nom}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-400">Aucun rôle</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Utilisateur) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/utilisateurs/${item.id}/modifier`); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Modifier"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(item); }}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors cursor-pointer"
            title="Basculer statut"
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
        title="Utilisateurs"
        subtitle="Gestion des comptes utilisateurs"
        actions={
          <Button icon={<UserPlus size={16} />} onClick={() => navigate('/utilisateurs/nouveau')}>
            Nouvel utilisateur
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={utilisateurs}
        loading={loading}
        emptyMessage="Aucun utilisateur trouvé"
        searchable
        searchPlaceholder="Rechercher un utilisateur..."
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Supprimer"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${confirmModal.item?.nom_utilisateur}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
