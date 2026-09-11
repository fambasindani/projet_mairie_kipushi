import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRCodeLib from 'qrcode';
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ShieldOff,
  FileText,
  Clock,
  AlertTriangle,
  BadgeCheck,
  Calculator,
  Send,
  RefreshCw,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import DeclarationPDF from '../components/pdf/DeclarationPDF';
import { declarationService } from '../services/declarationService';
import { penaliteService, type PenaliteCalculation } from '../services/penaliteService';
import type { DeclarationPaiement, PaginatedResponse } from '../types';
import { useAuth } from '../context/AuthContext';

const statutBadge: Record<string, 'warning' | 'success' | 'danger' | 'neutral' | 'info'> = {
  en_attente: 'warning',
  paye: 'success',
  en_retard: 'danger',
  conteste: 'neutral',
  annule: 'neutral',
  exonere: 'info',
};

const statutLabels: Record<string, string> = {
  en_attente: 'En attente',
  paye: 'Payé',
  en_retard: 'En retard',
  conteste: 'Contesté',
  annule: 'Annulé',
  exonere: 'Exonéré',
};

const formatMontant = (val: number | string) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', currencyDisplay: 'code', minimumFractionDigits: 0 }).format(Number(val) || 0);

export default function Declarations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOperateur = user?.roles?.some((r) => r.nom === 'Operateur');
  const [declarations, setDeclarations] = useState<DeclarationPaiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewModal, setViewModal] = useState({ isOpen: false, item: null as DeclarationPaiement | null });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; item: DeclarationPaiement | null; action: '' | 'valider' | 'annuler' | 'exonerer' }>({ isOpen: false, item: null, action: '' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: DeclarationPaiement | null }>({ isOpen: false, item: null });

  const [penaliteModal, setPenaliteModal] = useState<{ isOpen: boolean; item: DeclarationPaiement | null; calculation: PenaliteCalculation | null }>({ isOpen: false, item: null, calculation: null });
  const [calculatingPenalite, setCalculatingPenalite] = useState(false);
  const [applyingPenalite, setApplyingPenalite] = useState(false);

  const [miseEnDemeureModal, setMiseEnDemeureModal] = useState<{ isOpen: boolean; item: DeclarationPaiement | null }>({ isOpen: false, item: null });
  const [miseEnDemeureMotif, setMiseEnDemeureMotif] = useState('');
  const [sendingMiseEnDemeure, setSendingMiseEnDemeure] = useState(false);

  const [annulationModal, setAnnulationModal] = useState<{ isOpen: boolean; item: DeclarationPaiement | null }>({ isOpen: false, item: null });
  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [sendingAnnulation, setSendingAnnulation] = useState(false);

  const [printModal, setPrintModal] = useState<{ isOpen: boolean; item: DeclarationPaiement | null; qrDataUrl: string | null }>({ isOpen: false, item: null, qrDataUrl: null });
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const [stats, setStats] = useState({ total: 0, en_attente: 0, paye: 0, en_retard: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const fetchDeclarations = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<DeclarationPaiement> = await declarationService.list({ page, per_page: perPage, search: q });
        setDeclarations(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des déclarations');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await declarationService.statistiques();
      setStats({
        total: (res.total as number) ?? 0,
        en_attente: (res.en_attente as number) ?? 0,
        paye: (res.paye as number) ?? 0,
        en_retard: (res.en_retard as number) ?? 0,
      });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeclarations(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDeclarations(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchDeclarations(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchDeclarations(1, perPage, search);

  const openView = (item: DeclarationPaiement) => setViewModal({ isOpen: true, item });

  const openConfirm = (item: DeclarationPaiement, action: 'valider' | 'annuler' | 'exonerer') => {
    setOpenDropdown(null);
    if (action === 'annuler') {
      setAnnulationModal({ isOpen: true, item });
      setMotifAnnulation('');
      return;
    }
    setConfirmModal({ isOpen: true, item, action });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.item) return;
    try {
      if (confirmModal.action === 'valider') {
        await declarationService.valider(confirmModal.item.id);
        toast.success('Déclaration validée');
      } else if (confirmModal.action === 'exonerer') {
        await declarationService.exonerer(confirmModal.item.id);
        toast.success('Déclaration exonérée');
      }
      setConfirmModal({ isOpen: false, item: null, action: '' });
      fetchDeclarations(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de l\'action';
      toast.error(msg);
    }
  };

  const handleAnnuler = async () => {
    if (!annulationModal.item || !motifAnnulation.trim()) return;
    setSendingAnnulation(true);
    try {
      await declarationService.annuler(annulationModal.item.id, motifAnnulation.trim());
      toast.success('Déclaration annulée');
      setAnnulationModal({ isOpen: false, item: null });
      setMotifAnnulation('');
      fetchDeclarations(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de l\'annulation';
      toast.error(msg);
    } finally {
      setSendingAnnulation(false);
    }
  };

  const confirmMessages: Record<string, string> = {
    valider: 'Êtes-vous sûr de vouloir valider cette déclaration ?',
    annuler: 'Êtes-vous sûr de vouloir annuler cette déclaration ?',
    exonerer: 'Êtes-vous sûr de vouloir exonérer cette déclaration ?',
  };

  const handleCalculerPenalites = async (item: DeclarationPaiement) => {
    setOpenDropdown(null);
    setCalculatingPenalite(true);
    try {
      const calculation = await penaliteService.calculer(item.id);
      setPenaliteModal({ isOpen: true, item, calculation });
    } catch {
      toast.error('Erreur lors du calcul des pénalités');
    } finally {
      setCalculatingPenalite(false);
    }
  };

  const handleAppliquerPenalites = async () => {
    if (!penaliteModal.item) return;
    setApplyingPenalite(true);
    try {
      await penaliteService.appliquer(penaliteModal.item.id);
      toast.success('Pénalités appliquées avec succès');
      setPenaliteModal({ isOpen: false, item: null, calculation: null });
      fetchDeclarations(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de l\'application des pénalités');
    } finally {
      setApplyingPenalite(false);
    }
  };

  const handleOuvrirMiseEnDemeure = (item: DeclarationPaiement) => {
    setOpenDropdown(null);
    setMiseEnDemeureMotif('');
    setMiseEnDemeureModal({ isOpen: true, item });
  };

  const handleEnvoyerMiseEnDemeure = async () => {
    if (!miseEnDemeureModal.item) return;
    setSendingMiseEnDemeure(true);
    try {
      await penaliteService.envoyerMiseEnDemeure(miseEnDemeureModal.item.id, miseEnDemeureMotif || undefined);
      toast.success('Mise en demeure envoyée avec succès');
      setMiseEnDemeureModal({ isOpen: false, item: null });
      fetchDeclarations(pagination.currentPage, pagination.perPage, search);
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l\'envoi de la mise en demeure');
    } finally {
      setSendingMiseEnDemeure(false);
    }
  };

  const handleMettreAJourRetards = async () => {
    try {
      const res = await penaliteService.mettreAJourToutes();
      toast.success(`${res.count} déclaration(s) mise(s) à jour`);
      fetchDeclarations(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      await declarationService.delete(deleteModal.item.id);
      toast.success('Déclaration supprimée');
      setDeleteModal({ isOpen: false, item: null });
      fetchDeclarations(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression');
    }
  };

  const handlePrint = async (item: DeclarationPaiement) => {
    setOpenDropdown(null);
    try {
      const verifyUrl = `${window.location.origin}/api/verifier-declaration/${item.id}`;
      const qrDataUrl = await QRCodeLib.toDataURL(verifyUrl, { width: 120, margin: 1 });
      setPrintModal({ isOpen: true, item, qrDataUrl });
    } catch {
      setPrintModal({ isOpen: true, item, qrDataUrl: null });
    }
  };

  const columns = [
    {
      key: 'personne',
      label: 'Opérateur',
      sortable: true,
      render: (item: DeclarationPaiement) => (
        <span className="font-medium text-gray-800">
          {item.personne ? `${item.personne.nom} ${item.personne.prenom ?? ''}`.trim() : `#${item.personne_id}`}
        </span>
      ),
    },
    {
      key: 'taxe',
      label: 'Taxe',
      render: (item: DeclarationPaiement) => (
        <span className="text-sm text-gray-700">{item.taxe?.nom ?? `#${item.taxe_id}`}</span>
      ),
    },
    { key: 'exercice', label: 'Exercice' },
    {
      key: 'montant_total',
      label: 'Montant total',
      sortable: true,
      render: (item: DeclarationPaiement) => (
        <span className="font-medium text-gray-800">{formatMontant(item.montant_total)}</span>
      ),
    },
    {
      key: 'periode',
      label: 'Période',
      render: (item: DeclarationPaiement) => (
        <span className="text-sm text-gray-600">
          {new Date(item.periode_debut).toLocaleDateString('fr-FR')} - {new Date(item.periode_fin).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (item: DeclarationPaiement) => (
        <Badge variant={statutBadge[item.statut] ?? 'neutral'}>{statutLabels[item.statut] ?? item.statut}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: DeclarationPaiement) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(openDropdown === item.id ? null : item.id);
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer text-sm"
          >
            Actions <ChevronDown size={14} />
          </button>
          {openDropdown === item.id && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setOpenDropdown(null); openView(item); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Eye size={14} className="text-gray-400" /> Voir détail
              </button>
              <button
                onClick={() => handlePrint(item)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Printer size={14} className="text-gray-400" /> Imprimer
              </button>
              {!isOperateur && item.statut === 'en_attente' && (
                <button
                  onClick={() => navigate(`/declarations/${item.id}/modifier`)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <Pencil size={14} className="text-gray-400" /> Modifier
                </button>
              )}
              {!isOperateur && item.statut === 'en_attente' && (
                <button
                  onClick={() => openConfirm(item, 'valider')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                >
                  <CheckCircle size={14} className="text-emerald-400" /> Valider
                </button>
              )}
              {!isOperateur && (item.statut === 'en_attente' || item.statut === 'en_retard') && !item.mise_en_demeure_envoyee && (
                <button
                  onClick={() => handleCalculerPenalites(item)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 cursor-pointer"
                  disabled={calculatingPenalite}
                >
                  <Calculator size={14} className="text-orange-400" /> Calculer pénalités
                </button>
              )}
              {!isOperateur && (item.statut === 'en_attente' || item.statut === 'en_retard') && !item.mise_en_demeure_envoyee && (
                <button
                  onClick={() => handleOuvrirMiseEnDemeure(item)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 cursor-pointer"
                >
                  <Send size={14} className="text-purple-400" /> Mise en demeure
                </button>
              )}
              {!isOperateur && (item.statut === 'paye' || item.statut === 'en_attente') && (
                <button
                  onClick={() => openConfirm(item, 'annuler')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <XCircle size={14} className="text-red-400" /> Annuler
                </button>
              )}
              {!isOperateur && item.statut === 'en_attente' && (
                <button
                  onClick={() => openConfirm(item, 'exonerer')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer"
                >
                  <ShieldOff size={14} className="text-blue-400" /> Exonérer
                </button>
              )}
              {!isOperateur && item.statut === 'en_attente' && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setOpenDropdown(null); setDeleteModal({ isOpen: true, item }); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={14} className="text-red-400" /> Supprimer
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Déclarations de paiement"
        subtitle="Gestion des déclarations et paiements de taxes"
        actions={
          <div className="flex items-center gap-2">
            {!isOperateur && (
              <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={handleMettreAJourRetards}>
                Mettre à jour les retards
              </Button>
            )}
            {!isOperateur && (
              <Button icon={<Plus size={16} />} onClick={() => navigate('/declarations/nouveau')}>
                Nouvelle déclaration
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total} icon={<FileText size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="En attente" value={stats.en_attente} icon={<Clock size={22} />} color="warning" loading={statsLoading} />
        <StatCard title="Payées" value={stats.paye} icon={<BadgeCheck size={22} />} color="success" loading={statsLoading} />
        <StatCard title="En retard" value={stats.en_retard} icon={<AlertTriangle size={22} />} color="danger" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={declarations}
        loading={loading}
        emptyMessage="Aucune déclaration trouvée"
        searchable
        searchPlaceholder="Rechercher une déclaration..."
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
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, item: null })}
        title="Détails de la déclaration"
        size="lg"
      >
        {viewModal.item && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Opérateur</p>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {viewModal.item.personne ? `${viewModal.item.personne.nom} ${viewModal.item.personne.prenom ?? ''}`.trim() : `#${viewModal.item.personne_id}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Taxe</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{viewModal.item.taxe?.nom ?? `#${viewModal.item.taxe_id}`}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Exercice</p>
                <p className="text-sm text-gray-800 mt-1">{viewModal.item.exercice}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Statut</p>
                <div className="mt-1">
                  <Badge variant={statutBadge[viewModal.item.statut] ?? 'neutral'}>
                    {statutLabels[viewModal.item.statut] ?? viewModal.item.statut}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Période</p>
                <p className="text-sm text-gray-800 mt-1">
                  {new Date(viewModal.item.periode_debut).toLocaleDateString('fr-FR')} - {new Date(viewModal.item.periode_fin).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date limite</p>
                <p className="text-sm text-gray-800 mt-1">{new Date(viewModal.item.date_limite_paiement).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Montants</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Montant base</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{formatMontant(viewModal.item.montant_base)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Montant taxe</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{formatMontant(viewModal.item.montant_taxe)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Pénalités</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{formatMontant(viewModal.item.penalites)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Montant total</p>
                  <p className="text-sm font-bold text-primary-600 mt-1">{formatMontant(viewModal.item.montant_total)}</p>
                </div>
              </div>
            </div>

            {viewModal.item.observations && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Observations</p>
                <p className="text-sm text-gray-800 mt-1">{viewModal.item.observations}</p>
              </div>
            )}

            {(viewModal.item.nombre_jours_retard > 0 || viewModal.item.penalites > 0) && (
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Détail des pénalités
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-red-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Jours de retard</p>
                    <p className="text-sm font-medium text-red-700 mt-1">{viewModal.item.nombre_jours_retard}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Majoration retard</p>
                    <p className="text-sm font-medium text-red-700 mt-1">{formatMontant(viewModal.item.majoration_retard)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Intérêt mensuel</p>
                    <p className="text-sm font-medium text-red-700 mt-1">{formatMontant(viewModal.item.interet_retard)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total pénalités</p>
                    <p className="text-sm font-bold text-red-700 mt-1">{formatMontant(viewModal.item.penalites)}</p>
                  </div>
                </div>
                {viewModal.item.mise_en_demeure_envoyee && (
                  <div className="mt-3 bg-amber-50 rounded-lg p-3 flex items-center gap-2">
                    <Send size={14} className="text-amber-600" />
                    <span className="text-sm text-amber-700">
                      Mise en demeure envoyée le {viewModal.item.date_mise_en_demeure ? new Date(viewModal.item.date_mise_en_demeure).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setViewModal({ isOpen: false, item: null })}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null, action: '' })}
        onConfirm={handleConfirmAction}
        title={confirmModal.action === 'valider' ? 'Valider' : 'Exonérer'}
        message={confirmMessages[confirmModal.action] ?? ''}
        confirmText={confirmModal.action === 'valider' ? 'Valider' : 'Exonérer'}
        variant="danger"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Supprimer la déclaration"
        message={`Êtes-vous sûr de vouloir supprimer cette déclaration ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />

      <Modal
        isOpen={annulationModal.isOpen}
        onClose={() => { setAnnulationModal({ isOpen: false, item: null }); setMotifAnnulation(''); }}
        title="Annuler la déclaration"
        size="md"
      >
        {annulationModal.item && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Opérateur :</span> {annulationModal.item.personne ? `${annulationModal.item.personne.nom} ${annulationModal.item.personne.prenom ?? ''}`.trim() : ''}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Taxe :</span> {annulationModal.item.taxe?.nom}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motif de l'annulation <span className="text-red-500">*</span></label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="Saisissez le motif de l'annulation..."
                value={motifAnnulation}
                onChange={(e) => setMotifAnnulation(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => { setAnnulationModal({ isOpen: false, item: null }); setMotifAnnulation(''); }}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleAnnuler}
                disabled={!motifAnnulation.trim() || sendingAnnulation}
              >
                {sendingAnnulation ? 'Annulation...' : 'Confirmer l\'annulation'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={penaliteModal.isOpen}
        onClose={() => setPenaliteModal({ isOpen: false, item: null, calculation: null })}
        title="Calcul des pénalités"
        size="md"
      >
        {penaliteModal.item && penaliteModal.calculation && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Opérateur :</span> {penaliteModal.item.personne ? `${penaliteModal.item.personne.nom} ${penaliteModal.item.personne.prenom ?? ''}`.trim() : ''}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Taxe :</span> {penaliteModal.item.taxe?.nom}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Jours de retard</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{penaliteModal.calculation.jours_retard}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total pénalités</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatMontant(penaliteModal.calculation.total_penalites)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Majoration de retard :</span>
                <span className="font-medium text-gray-800">{formatMontant(penaliteModal.calculation.majoration_retard)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Intérêt de retard mensuel :</span>
                <span className="font-medium text-gray-800">{formatMontant(penaliteModal.calculation.interet_retard)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                <span className="text-gray-600">Nouveau montant total :</span>
                <span className="font-bold text-red-600">{formatMontant(penaliteModal.calculation.montant_total_avec_penalites)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setPenaliteModal({ isOpen: false, item: null, calculation: null })}>
                Annuler
              </Button>
              <Button
                onClick={handleAppliquerPenalites}
                loading={applyingPenalite}
                icon={<CheckCircle size={16} />}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Appliquer les pénalités
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={miseEnDemeureModal.isOpen}
        onClose={() => setMiseEnDemeureModal({ isOpen: false, item: null })}
        title="Envoyer une mise en demeure"
        size="md"
      >
        {miseEnDemeureModal.item && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm font-medium text-amber-800">Attention</p>
                <p className="text-sm text-amber-700 mt-1">
                  Une mise en demeure sera envoyée à l'opérateur pour la déclaration #{miseEnDemeureModal.item.id}.
                  Le contribuable disposera d'un délai supplémentaire pour régulariser sa situation.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Opérateur :</span> {miseEnDemeureModal.item.personne ? `${miseEnDemeureModal.item.personne.nom} ${miseEnDemeureModal.item.personne.prenom ?? ''}`.trim() : ''}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Montant dû :</span> {formatMontant(miseEnDemeureModal.item.montant_total)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motif (optionnel)</label>
              <textarea
                value={miseEnDemeureMotif}
                onChange={(e) => setMiseEnDemeureMotif(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Motif de la mise en demeure..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setMiseEnDemeureModal({ isOpen: false, item: null })}>
                Annuler
              </Button>
              <Button
                onClick={handleEnvoyerMiseEnDemeure}
                loading={sendingMiseEnDemeure}
                icon={<Send size={16} />}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Envoyer la mise en demeure
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Modal */}
      <Modal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal({ isOpen: false, item: null, qrDataUrl: null })}
        title="Imprimer la déclaration"
        size="xl"
      >
        {printModal.item && (
          <div className="space-y-4">
            <div style={{ height: '400px' }}>
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <DeclarationPDF
                  data={{
                    id: printModal.item.id,
                    operateur_nom: printModal.item.personne ? `${printModal.item.personne.nom} ${printModal.item.personne.prenom ?? ''}`.trim() : '',
                    taxe_nom: printModal.item.taxe?.nom,
                    exercice: printModal.item.exercice,
                    periode_debut: printModal.item.periode_debut,
                    periode_fin: printModal.item.periode_fin,
                    date_limite_paiement: printModal.item.date_limite_paiement,
                    montant_base: printModal.item.montant_base,
                    montant_taxe: printModal.item.montant_taxe,
                    penalites: printModal.item.penalites,
                    montant_total: printModal.item.montant_total,
                    statut: printModal.item.statut,
                    date_paiement: printModal.item.date_paiement,
                    nombre_jours_retard: printModal.item.nombre_jours_retard,
                    reference_paiement: printModal.item.reference_paiement,
                    observations: printModal.item.observations,
                    qrcode: printModal.qrDataUrl,
                  }}
                />
              </PDFViewer>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPrintModal({ isOpen: false, item: null, qrDataUrl: null })}>
                Fermer
              </Button>
              <PDFDownloadLink
                document={
                  <DeclarationPDF
                    data={{
                      id: printModal.item.id,
                      operateur_nom: printModal.item.personne ? `${printModal.item.personne.nom} ${printModal.item.personne.prenom ?? ''}`.trim() : '',
                      taxe_nom: printModal.item.taxe?.nom,
                      exercice: printModal.item.exercice,
                      periode_debut: printModal.item.periode_debut,
                      periode_fin: printModal.item.periode_fin,
                      date_limite_paiement: printModal.item.date_limite_paiement,
                      montant_base: printModal.item.montant_base,
                      montant_taxe: printModal.item.montant_taxe,
                      penalites: printModal.item.penalites,
                      montant_total: printModal.item.montant_total,
                      statut: printModal.item.statut,
                      date_paiement: printModal.item.date_paiement,
                      nombre_jours_retard: printModal.item.nombre_jours_retard,
                      reference_paiement: printModal.item.reference_paiement,
                      observations: printModal.item.observations,
                      qrcode: printModal.qrDataUrl,
                    }}
                  />
                }
                fileName={`declaration-${printModal.item.id}.pdf`}
              >
                {({ loading }) => (
                  <Button icon={<Printer size={16} />} disabled={loading}>
                    {loading ? 'Génération...' : 'Télécharger PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
