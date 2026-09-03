import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  Bell,
  ChevronRight,
  Activity,
  LayoutDashboard,
  Building2,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
  Loader2,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import Badge from '../components/ui/Badge';
import Skeleton from 'react-loading-skeleton';
import { dashboardService } from '../services/dashboardService';
import { declarationService } from '../services/declarationService';
import { notificationService } from '../services/notificationService';
import type { DeclarationPaiement, Notification, DashboardGlobal, DashboardFinances } from '../types';

interface DashboardData {
  operateurs?: { total?: number; actifs?: number; formalises?: number };
  finances?: { total_collecte?: number; en_attente?: number; en_retard?: number; nb_factures?: number };
  taxes?: { total?: number; actives?: number };
  utilisateurs?: { total?: number };
}

const statutBadge: Record<string, { variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral'; label: string }> = {
  paye: { variant: 'success', label: 'Payé' },
  en_attente: { variant: 'warning', label: 'En attente' },
  en_retard: { variant: 'danger', label: 'En retard' },
  conteste: { variant: 'info', label: 'Contesté' },
  annule: { variant: 'neutral', label: 'Annulé' },
  exonere: { variant: 'info', label: 'Exonéré' },
};

const statutColors: Record<string, string> = {
  paye: '#10b981',
  en_attente: '#f59e0b',
  en_retard: '#ef4444',
  conteste: '#3b82f6',
  annule: '#94a3b8',
  exonere: '#8b5cf6',
};

function formatCdf(value: number): string {
  return new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCdfShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M CDF`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K CDF`;
  return `${value.toLocaleString('fr-CD')} CDF`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const monthNamesLong = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700">
      <p className="text-xs font-medium text-slate-300 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{formatCdf(payload[0].value)}</p>
    </div>
  );
}

type FilterMode = 'all' | 'mois_annee' | 'annee';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [finances, setFinances] = useState<DashboardFinances | null>(null);
  const [declarations, setDeclarations] = useState<DeclarationPaiement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const chartData = useMemo(() => {
    if (!finances?.par_mois) return [];

    let filtered = [...finances.par_mois];

    if (filterMode === 'mois_annee') {
      filtered = filtered.filter((m) => m.mois === selectedMonth);
    } else if (filterMode === 'annee') {
      filtered = filtered.filter((m) => m.mois.startsWith(selectedYear));
    }

    const sorted = filtered.sort((a, b) => a.mois.localeCompare(b.mois));

    return sorted.map((item) => {
      const [year, month] = item.mois.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      return {
        name: monthNames[monthIdx] || month,
        fullLabel: `${monthNamesLong[monthIdx]} ${year}`,
        montant: Number(item.montant) || 0,
        total: item.total,
      };
    });
  }, [finances, filterMode, selectedMonth, selectedYear]);

  const maxMontant = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map((d) => d.montant));
  }, [chartData]);

  const filteredTotal = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.montant, 0);
  }, [chartData]);

  const filteredDeclarationCount = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.total, 0);
  }, [chartData]);

  const isFiltered = filterMode !== 'all';

  const chartGrowth = useMemo(() => {
    if (chartData.length < 2) return null;
    const prev = chartData[chartData.length - 2].montant;
    const curr = chartData[chartData.length - 1].montant;
    if (prev === 0) return null;
    return ((curr - prev) / prev * 100).toFixed(1);
  }, [chartData]);

  const availableMonths = useMemo(() => {
    if (!finances?.par_mois) return [];
    const months = [...new Set(finances.par_mois.map((m) => m.mois))].sort().reverse();
    return months;
  }, [finances]);

  const availableYears = useMemo(() => {
    if (!finances?.par_mois) return [];
    return [...new Set(finances.par_mois.map((m) => m.mois.substring(0, 4)))].sort().reverse();
  }, [finances]);

  const fetchAll = async () => {
    try {
      const [globalData, finData, declData, notifData] = await Promise.allSettled([
        dashboardService.global(),
        dashboardService.finances(),
        declarationService.list({ per_page: 5 }),
        notificationService.list({ per_page: 6 }),
      ]);

      if (globalData.status === 'fulfilled') setStats(globalData.value as DashboardData);
      if (finData.status === 'fulfilled') setFinances(finData.value);
      if (declData.status === 'fulfilled') {
        const d = declData.value;
        setDeclarations(Array.isArray(d) ? d : (d as any)?.data ?? []);
      }
      if (notifData.status === 'fulfilled') {
        const n = notifData.value;
        setNotifications(Array.isArray(n) ? n : (n as any)?.data ?? []);
      }
    } catch {
      toast.error('Erreur lors du chargement du tableau de bord');
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchAll();
    setIsRefreshing(false);
    toast.success('Données actualisées');
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    };
    load();
  }, []);

  const barColor = maxMontant > 0 ? '#6366f1' : '#cbd5e1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-xl opacity-30" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30">
                <LayoutDashboard className="text-white" size={24} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tableau de bord</h1>
              <p className="text-sm text-slate-500">Vue d'ensemble de l'activité fiscale</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Actualiser
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <Skeleton width={48} height={48} borderRadius={12} />
                  <div className="flex-1">
                    <Skeleton width="60%" height={12} />
                    <Skeleton width="80%" height={20} className="mt-2" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                icon={<Users size={22} />}
                gradient="from-indigo-500 to-indigo-600"
                glow="shadow-indigo-500/20"
                title="Opérateurs"
                value={stats?.operateurs?.total ?? 0}
                subtitle={`${stats?.operateurs?.actifs ?? 0} actifs`}
              />
              <StatCard
                icon={<DollarSign size={22} />}
                gradient="from-emerald-500 to-emerald-600"
                glow="shadow-emerald-500/20"
                title={isFiltered ? "Revenus (filtrés)" : "Revenus collectés"}
                value={isFiltered ? formatCdf(filteredTotal) : (stats?.finances?.total_collecte ? formatCdf(stats.finances.total_collecte) : '0 CDF')}
                subtitle={`${isFiltered ? filteredDeclarationCount : (stats?.finances?.nb_factures ?? 0)} factures`}
              />
              <StatCard
                icon={<Clock size={22} />}
                gradient="from-amber-500 to-amber-600"
                glow="shadow-amber-500/20"
                title="En attente"
                value={stats?.finances?.en_attente ? formatCdf(stats.finances.en_attente) : '0 CDF'}
                subtitle="Paiements en cours"
              />
              <StatCard
                icon={<AlertTriangle size={22} />}
                gradient="from-red-500 to-red-600"
                glow="shadow-red-500/20"
                title="En retard"
                value={stats?.finances?.en_retard ? formatCdf(stats.finances.en_retard) : '0 CDF'}
                subtitle="Paiements échus"
              />
            </>
          )}
        </div>

        {/* Chart & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-500" />
                  Revenus mensuels
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Collecte sur les 6 derniers mois</p>
              </div>
              {chartGrowth && (
                <div className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full ${
                  Number(chartGrowth) >= 0
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-red-600 bg-red-50'
                }`}>
                  {Number(chartGrowth) >= 0 ? <TrendingUp size={14} /> : <ArrowDownRight size={14} />}
                  <span>{Number(chartGrowth) >= 0 ? '+' : ''}{chartGrowth}%</span>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterMode === 'all'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterMode('mois_annee')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterMode === 'mois_annee'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Mois
                </button>
                <button
                  onClick={() => setFilterMode('annee')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterMode === 'annee'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Année
                </button>
              </div>

              {filterMode === 'mois_annee' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  {availableMonths.map((m) => {
                    const [y, mo] = m.split('-');
                    return (
                      <option key={m} value={m}>
                        {monthNamesLong[parseInt(mo, 10) - 1]} {y}
                      </option>
                    );
                  })}
                </select>
              )}

              {filterMode === 'annee' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Recharts Bar Chart */}
            {loading ? (
              <div className="h-64">
                <Skeleton width="100%" height="100%" borderRadius={12} />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Activity size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">Aucune donnée pour cette période</p>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => formatCdfShort(val)}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                    <Bar
                      dataKey="montant"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.montant === maxMontant ? '#6366f1' : '#a5b4fc'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <CircleDot size={18} className="text-indigo-500" />
              Aperçu rapide
            </h2>
            <div className="space-y-4">
              <QuickStat
                icon={<Building2 size={18} className="text-indigo-500" />}
                label="Taxes actives"
                value={stats?.taxes?.actives ?? 0}
                total={stats?.taxes?.total ?? 0}
              />
              <QuickStat
                icon={<Users size={18} className="text-emerald-500" />}
                label="Utilisateurs"
                value={stats?.utilisateurs?.total ?? 0}
              />
              <QuickStat
                icon={<FileText size={18} className="text-amber-500" />}
                label="Factures"
                value={stats?.finances?.nb_factures ?? 0}
              />
              <QuickStat
                icon={<CreditCard size={18} className="text-purple-500" />}
                label="Taux recouvrement"
                value={
                  stats?.finances?.total_collecte && stats?.finances?.en_attente
                    ? Math.round(
                        (stats.finances.total_collecte /
                          (stats.finances.total_collecte + stats.finances.en_attente)) *
                          100
                      )
                    : finances?.recouvrement?.taux ?? 0
                }
                suffix="%"
              />
            </div>
          </div>
        </div>

        {/* Declarations & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Declarations */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  Déclarations récentes
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">5 dernières</span>
              </div>
              <div className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                      <Skeleton width={40} height={40} borderRadius={12} />
                      <div className="flex-1">
                        <Skeleton width="45%" height={14} />
                        <Skeleton width="25%" height={12} className="mt-1.5" />
                      </div>
                      <Skeleton width={80} height={24} borderRadius={999} />
                      <Skeleton width={70} height={14} />
                    </div>
                  ))
                ) : declarations.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <FileText size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400">Aucune déclaration récente</p>
                  </div>
                ) : (
                  declarations.map((d) => (
                    <div
                      key={d.id}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all duration-150 cursor-pointer group"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ backgroundColor: statutColors[d.statut] ?? '#94a3b8' }}
                      >
                        {d.taxe?.nom?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {d.personne?.nom_complet ?? d.personne?.denomination_sociale ?? `${d.personne?.prenom ?? ''} ${d.personne?.nom ?? '—'}`.trim()}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{d.taxe?.nom ?? '—'}</p>
                      </div>
                      <Badge variant={statutBadge[d.statut]?.variant ?? 'neutral'}>
                        {statutBadge[d.statut]?.label ?? d.statut}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">{formatCdf(d.montant_total)}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(d.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm h-full">
              <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Bell size={16} className="text-indigo-500" />
                  Notifications
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">6 dernières</span>
              </div>
              <div className="relative">
                <div className="absolute left-[33px] top-0 bottom-0 w-px bg-slate-100" />
                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="px-6 py-4 flex items-start gap-4">
                        <Skeleton width={12} height={12} circle />
                        <div className="flex-1 pt-0.5">
                          <Skeleton width="85%" height={14} />
                          <Skeleton width="40%" height={11} className="mt-2" />
                        </div>
                      </div>
                    ))
                  ) : notifications.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <Bell size={40} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-sm text-slate-400">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-all duration-150 cursor-pointer"
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ring-4 ${
                            n.est_lue
                              ? 'bg-slate-300 ring-slate-100'
                              : 'bg-indigo-500 ring-indigo-100 animate-pulse'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium leading-snug ${
                              n.est_lue ? 'text-slate-500' : 'text-slate-800'
                            }`}
                          >
                            {n.sujet}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.est_lue && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANTS
// ============================================================

function StatCard({
  icon,
  gradient,
  glow,
  title,
  value,
  subtitle,
  trend,
  trendUp,
}: {
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  title: string;
  value: number | string;
  subtitle: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg ${glow} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 -bottom-12 h-40 w-40 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-sm">
            <div className="text-white">{icon}</div>
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trendUp ? 'text-emerald-100' : 'text-red-100'
              } bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm`}
            >
              {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-white/70">{title}</p>
          <p className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</p>
          <p className="text-xs text-white/60 mt-1.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
  total,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-800">
          {value}{suffix || ''}
        </span>
        {total !== undefined && (
          <span className="text-xs text-slate-400">/ {total}</span>
        )}
      </div>
    </div>
  );
}
