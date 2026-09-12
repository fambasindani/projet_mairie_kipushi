import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRCodeLib from 'qrcode';
import {
  Plus,
  Pencil,
  Trash2,
  Printer,
  CheckCircle,
  Receipt,
  Search,
  DollarSign,
  FileText,
} from 'lucide-react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';
import RecuPerceptionPDF from '../components/pdf/RecuPerceptionPDF';
import {
  recuPerceptionService,
  type RecuPerception,
  type PaginatedRecus,
  type TypePerception,
  typePerceptionLabels,
} from '../services/recuPerceptionService';
import { taxeService } from '../services/taxeService';
import { useAuth } from '../context/AuthContext';
import type { Taxe } from '../types';

const typeBadge: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  peage_urbain: 'info',
  pont_bascule: 'warning',
  etalage: 'success',
  chargement: 'info',
  dechargement: 'danger',
  autre: 'neutral',
};

const formatCdf = (v: number) => new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', currencyDisplay: 'code', minimumFractionDigits: 0 }).format(v);

export default function RecusPerception() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOperateur = user?.roles?.some((r) => r.nom === 'Operateur');
  const [recus, setRecus] = useState<RecuPerception[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [printRecu, setPrintRecu] = useState<RecuPerception | null>(null);
  const [printQrCode, setPrintQrCode] = useState<string | null>(null);
  const [confirmValider, setConfirmValider] = useState<RecuPerception | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RecuPerception | null>(null);
  const [taxes, setTaxes] = useState<Taxe[]>([]);
  const [stats, setStats] = useState({ total_recus: 0, montant_total: 0, par_type: [] as Array<{ type_perception: string; total: number; montant: number }> });
  const [filters, setFilters] = useState({ search: '', date_debut: '', date_fin: '', taxe_id: '', type_perception: '' });

  const loadRecus = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, per_page: 15 };
      if (filters.search) params.search = filters.search;
      if (filters.date_debut) params.date_debut = filters.date_debut;
      if (filters.date_fin) params.date_fin = filters.date_fin;
      if (filters.taxe_id) params.taxe_id = Number(filters.taxe_id);
      if (filters.type_perception) params.type_perception = filters.type_perception;

      const res: PaginatedRecus = await recuPerceptionService.list(params);
      setRecus(res.data);
      setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total });
    } catch {
      toast.error('Erreur lors du chargement des reçus');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const data = await recuPerceptionService.stats();
      setStats(data);
    } catch {}
  }, []);

  const loadTaxes = useCallback(async () => {
    try {
      const res = await taxeService.list({ per_page: 100 });
      setTaxes(res.data);
    } catch {}
  }, []);

  useEffect(() => { loadRecus(); loadStats(); loadTaxes(); }, [loadRecus, loadStats, loadTaxes]);

  const handlePrint = async (recu: RecuPerception) => {
    setPrintRecu(recu);
    setPrintQrCode(null);
    try {
      const res = await recuPerceptionService.qrcode(recu.id);
      const dataUrl = await QRCodeLib.toDataURL(res.url, { width: 120, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });
      setPrintQrCode(dataUrl);
    } catch {}
  };

  const handleValider = async (recu: RecuPerception) => {
    setConfirmValider(recu);
  };

  const confirmValiderAction = async () => {
    if (!confirmValider) return;
    try {
      await recuPerceptionService.valider(confirmValider.id);
      toast.success('Reçu validé');
      setConfirmValider(null);
      loadRecus();
      loadStats();
    } catch {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleDelete = async (recu: RecuPerception) => {
    setConfirmDelete(recu);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await recuPerceptionService.delete(confirmDelete.id);
      toast.success('Reçu supprimé');
      setConfirmDelete(null);
      loadRecus();
      loadStats();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getPdfData = (r: RecuPerception) => ({
    numero: r.numero,
    date_emission: r.date_emission,
    heure_emission: r.heure_emission,
    type_perception: r.type_perception,
    taxe_nom: r.taxe?.nom,
    categorie_vehicule: r.categorie_vehicule,
    plaque_immatriculation: r.plaque_immatriculation,
    montant: r.montant,
    trajet: r.trajet,
    chauffeur_nom: r.chauffeur_nom,
    conducteur_nom: r.conducteur_nom,
    designation: r.designation,
    poids: r.poids,
    Numero_Piece: r.Numero_Piece,
    percepteur_nom: r.percepteur ? `${r.percepteur.prenom || ''} ${r.percepteur.nom || ''}`.trim() : '',
    qrcode: printQrCode,
  });

  const columns = [
    { key: 'numero', label: 'N°', render: (r: RecuPerception) => <span className="font-mono font-bold text-indigo-600 text-xs">{r.numero}</span> },
    { key: 'type', label: 'Type', render: (r: RecuPerception) => <Badge variant={typeBadge[r.type_perception] ?? 'neutral'}>{typePerceptionLabels[r.type_perception as TypePerception] ?? r.type_perception}</Badge> },
    { key: 'date_emission', label: 'Date', render: (r: RecuPerception) => <span className="text-sm">{new Date(r.date_emission).toLocaleDateString('fr-FR')}{r.heure_emission ? ` ${r.heure_emission}` : ''}</span> },
    { key: 'taxe', label: 'Taxe', render: (r: RecuPerception) => <span className="text-sm">{r.taxe?.nom ?? '—'}</span> },
    { key: 'detail', label: 'Détail', render: (r: RecuPerception) => {
      if (r.plaque_immatriculation) return <span className="font-mono text-sm">{r.plaque_immatriculation}</span>;
      if (r.designation) return <span className="text-sm">{r.designation}</span>;
      return <span className="text-slate-400">—</span>;
    }},
    { key: 'montant', label: 'Montant', render: (r: RecuPerception) => <span className="font-bold text-emerald-600">{formatCdf(r.montant)}</span> },
    { key: 'statut', label: 'Statut', render: (r: RecuPerception) => (
      <Badge variant={r.valide ? 'success' : 'warning'}>{r.valide ? 'Validé' : 'En attente'}</Badge>
    )},
    {
      key: 'actions', label: '', render: (r: RecuPerception) => (
        <div className="flex items-center gap-1">
          {!isOperateur && !r.valide && (
            <button onClick={() => handleValider(r)}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer" title="Valider">
              <CheckCircle size={15} />
            </button>
          )}
          {!isOperateur && !r.valide && (
            <button onClick={() => navigate(`/recus-perception/${r.id}/modifier`)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer" title="Modifier">
              <Pencil size={15} />
            </button>
          )}
          {r.valide && (
            <button onClick={() => handlePrint(r)}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer" title="Imprimer">
              <Printer size={15} />
            </button>
          )}
          {!isOperateur && !r.valide && (
            <button onClick={() => handleDelete(r)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer" title="Supprimer">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reçus de perception"
        subtitle="Gestion des reçus de taxes ponctuelles"
        actions={
          !isOperateur ? (
            <Button onClick={() => navigate('/recus-perception/nouveau')}>
              <Plus size={16} /> Nouveau reçu
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total reçus" value={stats.total_recus} icon={<Receipt size={20} />} color="primary" />
        <StatCard title="Montant total" value={formatCdf(stats.montant_total)} icon={<DollarSign size={20} />} color="success" />
        {stats.par_type.slice(0, 2).map((pt) => (
          <StatCard
            key={pt.type_perception}
            title={typePerceptionLabels[pt.type_perception as TypePerception] ?? pt.type_perception}
            value={`${pt.total} — ${formatCdf(pt.montant)}`}
            icon={<FileText size={20} />}
            color="warning"
          />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher (N°, plaque, conducteur)..."
              value={filters.search} onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
          </div>
          <select value={filters.type_perception} onChange={(e) => setFilters(f => ({ ...f, type_perception: e.target.value }))}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
            <option value="">Tous les types</option>
            {(Object.entries(typePerceptionLabels) as [TypePerception, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input type="date" value={filters.date_debut} onChange={(e) => setFilters(f => ({ ...f, date_debut: e.target.value }))}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
          <input type="date" value={filters.date_fin} onChange={(e) => setFilters(f => ({ ...f, date_fin: e.target.value }))}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={recus}
        loading={loading}
        pagination={{
          currentPage: pagination.currentPage,
          lastPage: pagination.lastPage,
          total: pagination.total,
          perPage: 15,
          onPageChange: loadRecus,
          onPerPageChange: () => {},
        }}
        emptyMessage="Aucun reçu de perception"
      />

      {/* Print Modal */}
      <Modal isOpen={!!printRecu} onClose={() => setPrintRecu(null)} title={`Reçu ${printRecu?.numero || ''}`} size="lg">
        {printRecu && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden" style={{ height: '400px' }}>
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <RecuPerceptionPDF data={getPdfData(printRecu)} />
              </PDFViewer>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPrintRecu(null)}>Fermer</Button>
              <PDFDownloadLink
                document={<RecuPerceptionPDF data={getPdfData(printRecu)} />}
                fileName={`${printRecu.numero}.pdf`}
              >
                {({ loading }) => (
                  <Button disabled={loading}>
                    <Printer size={16} /> {loading ? 'Génération...' : 'Télécharger PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!confirmValider}
        onClose={() => setConfirmValider(null)}
        onConfirm={confirmValiderAction}
        title="Valider le reçu"
        message={`Confirmer la validation du reçu ${confirmValider?.numero} ? Cette action est irréversible.`}
        confirmText="Valider"
        variant="warning"
      />

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Supprimer le reçu"
        message={`Voulez-vous vraiment supprimer le reçu ${confirmDelete?.numero} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}
