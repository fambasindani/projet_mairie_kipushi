import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  Download,
  XCircle,
  FileText,
  DollarSign,
  Receipt,
  Printer,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { FactureDocument } from '../components/PDFFacture';
import { factureService } from '../services/factureService';
import type { Facture, PaginatedResponse } from '../types';

const statutBadge: Record<string, 'info' | 'success' | 'neutral'> = {
  emise: 'info',
  payee: 'success',
  annulee: 'neutral',
};

const statutLabels: Record<string, string> = {
  emise: 'Émise',
  payee: 'Payée',
  annulee: 'Annulée',
};

const formatMontant = (val: number, devise = 'CDF') =>
  new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: devise,
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
  }).format(val);

export default function Factures() {
  const navigate = useNavigate();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewModal, setViewModal] = useState({ isOpen: false, item: null as Facture | null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null as Facture | null });

  const [stats, setStats] = useState({ total: 0, montant_total: 0, montant_cdf: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchFactures = useCallback(
    async (page = 1, perPage = 20, q = '') => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Facture> = await factureService.list({ page, per_page: perPage, search: q });
        setFactures(res.data);
        setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total, perPage: res.per_page });
      } catch {
        toast.error('Erreur lors du chargement des factures');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await factureService.statistiques();
      const d = res as Record<string, unknown>;
      const parDevise = (d.par_devise as Array<{ devise: string; total: number }>) ?? [];
      const montantCdf = parDevise.find((p) => p.devise === 'CDF')?.total ?? 0;
      setStats({
        total: (d.total as number) ?? 0,
        montant_total: parseFloat(d.total_ttc as string) || 0,
        montant_cdf: montantCdf,
      });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactures(1, pagination.perPage, search);
    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchFactures(1, pagination.perPage, value);
    }, 300);
  };

  const handlePageChange = (page: number) => fetchFactures(page, pagination.perPage, search);
  const handlePerPageChange = (perPage: number) => fetchFactures(1, perPage, search);

  const openView = (item: Facture) => setViewModal({ isOpen: true, item });

  const openDelete = (item: Facture) => setConfirmModal({ isOpen: true, item });

  const handleDownload = async (item: Facture) => {
    try {
      const blob = await factureService.download(item.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture_${item.numero_facture}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Téléchargement réussi');
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handlePrint = async (item: Facture) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(
        JSON.stringify({ numero: item.numero_facture, montant: item.montant_total, statut: item.statut }),
        { width: 120, margin: 1, color: { dark: '#1e1b4b', light: '#ffffff' } }
      );
      const blob = await pdf(<FactureDocument facture={item} qrDataUrl={qrDataUrl} />).toBlob();
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (w) {
        w.onload = () => { w.print(); };
      }
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleAnnuler = async () => {
    if (!confirmModal.item) return;
    try {
      await factureService.annuler(confirmModal.item.id);
      toast.success('Facture annulée');
      setConfirmModal({ isOpen: false, item: null });
      fetchFactures(pagination.currentPage, pagination.perPage, search);
      fetchStats();
    } catch {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const columns = [
    {
      key: 'numero_facture',
      label: 'Numéro facture',
      sortable: true,
      render: (item: Facture) => (
        <span className="font-mono text-sm font-medium text-primary-600">{item.numero_facture}</span>
      ),
    },
    {
      key: 'personne',
      label: 'Personne',
      render: (item: Facture) => {
        const p = item.declaration_paiement?.personne;
        const nom = p?.nom_complet ?? [p?.prenom, p?.nom].filter(Boolean).join(' ') ?? p?.denomination_sociale ?? '—';
        return <span className="text-sm text-gray-700">{nom}</span>;
      },
    },
    {
      key: 'taxe',
      label: 'Taxe',
      render: (item: Facture) => (
        <span className="text-sm text-gray-600">{item.declaration_paiement?.taxe?.nom ?? '—'}</span>
      ),
    },
    {
      key: 'date_emission',
      label: 'Date émission',
      sortable: true,
      render: (item: Facture) => (
        <span className="text-sm text-gray-700">{new Date(item.date_emission).toLocaleDateString('fr-FR')}</span>
      ),
    },
    {
      key: 'montant_ht',
      label: 'Montant HT',
      sortable: true,
      render: (item: Facture) => (
        <span className="font-medium text-gray-800">{formatMontant(item.montant_ht, item.devise)}</span>
      ),
    },
    {
      key: 'montant_tva',
      label: 'Montant TVA',
      render: (item: Facture) => (
        <span className="text-sm text-gray-600">{formatMontant(item.montant_tva, item.devise)}</span>
      ),
    },
    {
      key: 'montant_total',
      label: 'Montant total',
      sortable: true,
      render: (item: Facture) => (
        <span className="font-bold text-gray-800">{formatMontant(item.montant_total, item.devise)}</span>
      ),
    },
    {
      key: 'devise',
      label: 'Devise',
      render: (item: Facture) => (
        <Badge variant={item.devise === 'USD' ? 'info' : 'warning'}>{item.devise}</Badge>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (item: Facture) => (
        <Badge variant={statutBadge[item.statut] ?? 'neutral'}>{statutLabels[item.statut] ?? item.statut}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Facture) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handlePrint(item); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Imprimer"
          >
            <Printer size={16} />
          </button>
          {item.chemin_pdf && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
              title="Télécharger PDF"
            >
              <Download size={16} />
            </button>
          )}
          {item.statut === 'emise' && (
            <button
              onClick={(e) => { e.stopPropagation(); openDelete(item); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
              title="Annuler"
            >
              <XCircle size={16} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); openView(item); }}
            className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-colors cursor-pointer"
            title="Voir"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures"
        subtitle="Gestion des factures et documents de facturation"
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('/factures/nouveau')}>
            Nouvelle facture
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total factures" value={stats.total} icon={<FileText size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Montant total TTC" value={formatMontant(stats.montant_total)} icon={<DollarSign size={22} />} color="success" loading={statsLoading} />
        <StatCard title="Montant CDF" value={formatMontant(stats.montant_cdf, 'CDF')} icon={<Receipt size={22} />} color="warning" loading={statsLoading} />
      </div>

      <DataTable
        columns={columns}
        data={factures}
        loading={loading}
        emptyMessage="Aucune facture trouvée"
        searchable
        searchPlaceholder="Rechercher une facture..."
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
        title="Détails de la facture"
        size="lg"
      >
        {viewModal.item && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Numéro facture</p>
                <p className="text-sm font-mono font-medium text-primary-600 mt-1">{viewModal.item.numero_facture}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date d'émission</p>
                <p className="text-sm text-gray-800 mt-1">{new Date(viewModal.item.date_emission).toLocaleDateString('fr-FR')}</p>
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
                <p className="text-xs text-gray-500 uppercase tracking-wider">Devise</p>
                <div className="mt-1">
                  <Badge variant={viewModal.item.devise === 'USD' ? 'info' : 'warning'}>{viewModal.item.devise}</Badge>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Montants</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Montant HT</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{formatMontant(viewModal.item.montant_ht, viewModal.item.devise)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Montant TVA</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{formatMontant(viewModal.item.montant_tva, viewModal.item.devise)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Montant total</p>
                  <p className="text-sm font-bold text-primary-600 mt-1">{formatMontant(viewModal.item.montant_total, viewModal.item.devise)}</p>
                </div>
              </div>
            </div>

            {viewModal.item.observations && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Observations</p>
                <p className="text-sm text-gray-800 mt-1">{viewModal.item.observations}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              {viewModal.item.chemin_pdf && (
                <Button
                  variant="secondary"
                  icon={<Download size={16} />}
                  onClick={() => handleDownload(viewModal.item!)}
                >
                  Télécharger PDF
                </Button>
              )}
              <Button variant="secondary" onClick={() => setViewModal({ isOpen: false, item: null })}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null })}
        onConfirm={handleAnnuler}
        title="Annuler la facture"
        message={`Êtes-vous sûr de vouloir annuler la facture "${confirmModal.item?.numero_facture}" ? Cette action est irréversible.`}
        confirmText="Annuler"
        variant="danger"
      />
    </div>
  );
}
