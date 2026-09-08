import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3,
  FileText,
  Users,
  Receipt,
  TrendingUp,
  MapPin,
  UserCheck,
  UserX,
  Building,
  IdCard,
  Download,
  Loader2,
  DollarSign,
  Clock,
  AlertTriangle,
  PieChart as PieChartIcon,
  CreditCard,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import Badge from '../components/ui/Badge';
import Skeleton from 'react-loading-skeleton';
import Button from '../components/ui/Button';
import { post } from '../services/api';

interface RapportParCommune {
  commune: string;
  total: number;
}

interface RapportEvolution {
  mois?: string;
  periode?: string;
  total: number;
  montant?: number;
}

interface RapportData {
  [key: string]: unknown;
  total?: number;
  actifs?: number;
  inactifs?: number;
  formalises?: number;
  non_formalises?: number;
  physiques?: number;
  morales?: number;
  par_commune?: RapportParCommune[];
  evolution?: RapportEvolution[];
  par_taxe?: { taxe?: { nom?: string }; nom?: string; code?: string; total: number; montant: number; montant_total?: number; total_collecte?: number }[];
  par_statut?: { statut?: string; total: number; montant?: number }[];
  par_categorie?: { categorie: string; total: number }[];
  par_periodicite?: { periodicite: string; total: number }[];
  collecte_par_taxe?: { nom: string; code: string; total_collecte: number }[];
  montant_total?: number;
  montant_paye?: number;
  montant_en_attente?: number;
  montant_en_retard?: number;
  montant_ht?: number;
  montant_tva?: number;
  montant_moyen?: number;
  taux_recouvrement?: number;
  total_penalites?: number;
  declarations_en_retard?: number;
  retards?: Array<{
    id: number;
    operateur: string;
    taxe: string;
    montant_total: number;
    date_limite: string;
    jours_retard: number;
    majoration: number;
    interet: number;
    statut: string;
  }>;
  actives?: number;
  inactives?: number;
  operateurs?: RapportData;
  paiements?: RapportData;
  taxes?: RapportData;
  factures?: RapportData;
  resume?: { total_operateurs?: number; total_collecte?: number; total_factures?: number; taux_recouvrement_global?: number };
}

const rapportTypes = [
  { key: 'global', label: 'Rapport global', icon: BarChart3, description: "Vue d'ensemble de toutes les activités", color: 'from-indigo-500 to-indigo-600' },
  { key: 'operateurs', label: 'Opérateurs', icon: Users, description: 'Statistiques sur les opérateurs enregistrés', color: 'from-blue-500 to-blue-600' },
  { key: 'paiements', label: 'Paiements', icon: Receipt, description: 'Analyse des déclarations et paiements', color: 'from-emerald-500 to-emerald-600' },
  { key: 'taxes', label: 'Taxes', icon: FileText, description: 'Collecte par type de taxe', color: 'from-amber-500 to-amber-600' },
  { key: 'factures', label: 'Factures', icon: FileText, description: 'Statistiques de facturation', color: 'from-purple-500 to-purple-600' },
];

const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatMonth(mois: string): string {
  const parts = mois.split('-');
  if (parts.length < 2) return mois;
  const idx = parseInt(parts[1], 10) - 1;
  return `${monthNames[idx] || parts[1]} ${parts[0]}`;
}

function formatCdf(value: number): string {
  return new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR');
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700">
      <p className="text-xs font-medium text-slate-300 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color || '#fff' }}>
          {entry.name}: {typeof entry.value === 'number' ? (entry.name?.includes('CDF') || entry.name?.includes('montant') ? formatCdf(entry.value) : formatNumber(entry.value)) : entry.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700">
      <p className="text-xs font-medium text-slate-300 mb-1">{entry.name}</p>
      <p className="text-sm font-bold text-white">{formatNumber(entry.value)}</p>
    </div>
  );
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

const chartColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#4f46e5', '#7c3aed', '#6d28d9', '#a855f7', '#d946ef'];

function StatCard({ icon, label, value, color, subtitle }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function ResultSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200/60 flex items-center gap-2">
        <span className="text-indigo-500">{icon}</span>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function OperateursReport({ data }: { data: RapportData }) {
  const physiqueMoraleData = [
    { name: 'Physiques', value: data.physiques ?? 0, color: '#6366f1' },
    { name: 'Morales', value: data.morales ?? 0, color: '#a78bfa' },
  ];
  const formalisationData = [
    { name: 'Formalisés', value: data.formalises ?? 0, color: '#10b981' },
    { name: 'Non formalisés', value: data.non_formalises ?? 0, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Total" value={formatNumber(data.total ?? 0)} color="from-indigo-500 to-indigo-600" subtitle={`${data.actifs ?? 0} actifs`} />
        <StatCard icon={<UserCheck size={20} />} label="Actifs" value={formatNumber(data.actifs ?? 0)} color="from-emerald-500 to-emerald-600" subtitle={`${data.total ? Math.round((data.actifs! / data.total) * 100) : 0}% du total`} />
        <StatCard icon={<IdCard size={20} />} label="Formalisés" value={formatNumber(data.formalises ?? 0)} color="from-blue-500 to-blue-600" subtitle={`${data.non_formalises ?? 0} non formalisés`} />
        <StatCard icon={<Building size={20} />} label="Personnes morales" value={formatNumber(data.morales ?? 0)} color="from-purple-500 to-purple-600" subtitle={`${data.physiques ?? 0} physiques`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><UserCheck size={18} className="text-emerald-600" /></div>
          <div><p className="text-xs text-slate-500">Actifs</p><p className="text-lg font-bold text-emerald-600">{data.actifs ?? 0}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50"><UserX size={18} className="text-red-600" /></div>
          <div><p className="text-xs text-slate-500">Inactifs</p><p className="text-lg font-bold text-red-600">{data.inactifs ?? 0}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50"><Building size={18} className="text-amber-600" /></div>
          <div><p className="text-xs text-slate-500">Non formalisés</p><p className="text-lg font-bold text-amber-600">{data.non_formalises ?? 0}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {data.par_commune && data.par_commune.length > 0 && (
          <div className="lg:col-span-2">
            <ResultSection title="Répartition par commune" icon={<MapPin size={16} />}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.par_commune} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="commune" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                    <Bar dataKey="total" name="Opérateurs" radius={[8, 8, 0, 0]} maxBarSize={50}>
                      {data.par_commune.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ResultSection>
          </div>
        )}
        <div className="space-y-6">
          {physiqueMoraleData.some(d => d.value > 0) && (
            <ResultSection title="Type d'opérateurs" icon={<PieChartIcon size={16} />}>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={physiqueMoraleData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                      {physiqueMoraleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ResultSection>
          )}
          {formalisationData.some(d => d.value > 0) && (
            <ResultSection title="Formalisation" icon={<CheckCircle size={16} />}>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={formalisationData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                      {formalisationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ResultSection>
          )}
        </div>
      </div>

      {data.evolution && data.evolution.length > 0 && (
        <ResultSection title="Évolution mensuelle" icon={<TrendingUp size={16} />}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.evolution.map(e => ({ ...e, name: formatMonth(e.mois ?? e.periode ?? '') }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="total" name="Opérateurs" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ResultSection>
      )}

      <ResultSection title="Résumé détaillé" icon={<FileText size={16} />}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200">
              <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Catégorie</th>
              <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Valeur</th>
              <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">%</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { label: 'Total opérateurs', value: data.total ?? 0, pct: 100, dot: 'bg-indigo-500', badge: 'info' as const },
                { label: 'Actifs', value: data.actifs ?? 0, pct: data.total ? Math.round((data.actifs! / data.total) * 100) : 0, dot: 'bg-emerald-500', badge: 'success' as const },
                { label: 'Inactifs', value: data.inactifs ?? 0, pct: data.total ? Math.round((data.inactifs! / data.total) * 100) : 0, dot: 'bg-red-500', badge: 'danger' as const },
                { label: 'Formalisés', value: data.formalises ?? 0, pct: data.total ? Math.round((data.formalises! / data.total) * 100) : 0, dot: 'bg-blue-500', badge: 'info' as const },
                { label: 'Non formalisés', value: data.non_formalises ?? 0, pct: data.total ? Math.round((data.non_formalises! / data.total) * 100) : 0, dot: 'bg-amber-500', badge: 'warning' as const },
                { label: 'Personnes physiques', value: data.physiques ?? 0, pct: data.total ? Math.round((data.physiques! / data.total) * 100) : 0, dot: 'bg-indigo-500', badge: 'info' as const },
                { label: 'Personnes morales', value: data.morales ?? 0, pct: data.total ? Math.round((data.morales! / data.total) * 100) : 0, dot: 'bg-purple-500', badge: 'info' as const },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">{formatNumber(row.value)}</td>
                  <td className="px-4 py-3 text-right"><Badge variant={row.badge}>{row.pct}%</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResultSection>

      {data.par_commune && data.par_commune.length > 0 && (
        <ResultSection title="Détail par commune" icon={<MapPin size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.par_commune.map((c, i) => (
              <div key={c.commune} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-all">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{c.commune}</p></div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{c.total}</p>
                  <p className="text-[11px] text-slate-400">{data.total ? Math.round((c.total / data.total) * 100) : 0}%</p>
                </div>
              </div>
            ))}
          </div>
        </ResultSection>
      )}
    </div>
  );
}

function PaiementsReport({ data }: { data: RapportData }) {
  const statutPieData = (data.par_statut ?? []).map(s => ({
    name: statutBadge[s.statut ?? '']?.label ?? s.statut ?? '',
    value: s.total,
    color: statutColors[s.statut ?? ''] ?? '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Receipt size={20} />} label="Total déclarations" value={formatNumber(data.total ?? 0)} color="from-emerald-500 to-emerald-600" />
        <StatCard icon={<DollarSign size={20} />} label="Montant total" value={formatCdf(data.montant_total ?? 0)} color="from-indigo-500 to-indigo-600" />
        <StatCard icon={<CheckCircle size={20} />} label="Montant payé" value={formatCdf(data.montant_paye ?? 0)} color="from-emerald-500 to-emerald-600" subtitle={`${data.taux_recouvrement ?? 0}% recouvrement`} />
        <StatCard icon={<AlertTriangle size={20} />} label="En retard" value={formatCdf(data.montant_en_retard ?? 0)} color="from-red-500 to-red-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><DollarSign size={18} className="text-emerald-600" /></div>
          <div><p className="text-xs text-slate-500">Payé</p><p className="text-lg font-bold text-emerald-600">{formatCdf(data.montant_paye ?? 0)}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50"><Clock size={18} className="text-amber-600" /></div>
          <div><p className="text-xs text-slate-500">En attente</p><p className="text-lg font-bold text-amber-600">{formatCdf(data.montant_en_attente ?? 0)}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50"><AlertTriangle size={18} className="text-red-600" /></div>
          <div><p className="text-xs text-slate-500">En retard</p><p className="text-lg font-bold text-red-600">{formatCdf(data.montant_en_retard ?? 0)}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statutPieData.length > 0 && (
          <ResultSection title="Répartition par statut" icon={<PieChartIcon size={16} />}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statutPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                    {statutPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ResultSection>
        )}

        {data.par_taxe && data.par_taxe.length > 0 && (
          <ResultSection title="Montant par taxe" icon={<BarChart3 size={16} />}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.par_taxe.map(t => ({ name: t.taxe?.nom ?? t.nom ?? '—', montant: t.montant ?? t.montant_total ?? 0, total: t.total }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCdf(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                  <Bar dataKey="montant" name="Montant CDF" radius={[0, 8, 8, 0]} maxBarSize={30}>
                    {data.par_taxe.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ResultSection>
        )}
      </div>

      {data.evolution && data.evolution.length > 0 && (
        <ResultSection title="Évolution des paiements" icon={<TrendingUp size={16} />}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.evolution.map(e => ({ ...e, name: formatMonth(e.mois ?? e.periode ?? '') }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCdf(v)} />
                <Tooltip content={<ChartTooltip />} />
                <defs><linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="montant" name="Montant CDF" stroke="#6366f1" strokeWidth={3} fill="url(#colorMontant)" dot={{ fill: '#6366f1', r: 4 }} />
                <Line type="monotone" dataKey="total" name="Déclarations" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} yAxisId={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ResultSection>
      )}

      {/* Retards de paiement */}
      {(data.declarations_en_retard ?? 0) > 0 && (
        <ResultSection title="Retards de paiement" icon={<AlertTriangle size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-red-50 rounded-xl border border-red-100 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100"><AlertTriangle size={18} className="text-red-600" /></div>
              <div><p className="text-xs text-red-500">Déclarations en retard</p><p className="text-lg font-bold text-red-700">{formatNumber(data.declarations_en_retard ?? 0)}</p></div>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100"><DollarSign size={18} className="text-orange-600" /></div>
              <div><p className="text-xs text-orange-500">Pénalités totales</p><p className="text-lg font-bold text-orange-700">{formatCdf(data.total_penalites ?? 0)}</p></div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><Clock size={18} className="text-slate-600" /></div>
              <div><p className="text-xs text-slate-500">Montant en retard</p><p className="text-lg font-bold text-slate-700">{formatCdf(data.montant_en_retard ?? 0)}</p></div>
            </div>
          </div>

          {data.retards && data.retards.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Opérateur</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Taxe</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Montant</th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Jours retard</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Majoration</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Intérêts</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Date limite</th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Statut</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.retards.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.operateur}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{r.taxe}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">{formatCdf(r.montant_total)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${r.jours_retard >= 60 ? 'bg-red-100 text-red-700' : r.jours_retard >= 30 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.jours_retard}j
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-orange-600 text-right">{formatCdf(r.majoration)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">{formatCdf(r.interet)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{r.date_limite ? new Date(r.date_limite).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statutBadge[r.statut ?? '']?.variant ?? 'neutral'}>{statutBadge[r.statut ?? '']?.label ?? r.statut}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ResultSection>
      )}

      <ResultSection title="Détail par statut" icon={<FileText size={16} />}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200">
              <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Statut</th>
              <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Nombre</th>
              <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Montant</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {(data.par_statut ?? []).map((s) => (
                <tr key={s.statut} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    <Badge variant={statutBadge[s.statut ?? '']?.variant ?? 'neutral'}>{statutBadge[s.statut ?? '']?.label ?? s.statut}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">{formatNumber(s.total)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">{formatCdf(s.montant ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResultSection>
    </div>
  );
}

function TaxesReport({ data }: { data: RapportData }) {
  const catPieData = (data.par_categorie ?? []).map((c, i) => ({
    name: c.categorie,
    value: c.total,
    color: chartColors[i % chartColors.length],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<FileText size={20} />} label="Total taxes" value={formatNumber(data.total ?? 0)} color="from-amber-500 to-amber-600" />
        <StatCard icon={<CheckCircle size={20} />} label="Actives" value={formatNumber(data.actives ?? 0)} color="from-emerald-500 to-emerald-600" />
        <StatCard icon={<XCircle size={20} />} label="Inactives" value={formatNumber(data.inactives ?? 0)} color="from-red-500 to-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {catPieData.length > 0 && (
          <ResultSection title="Répartition par catégorie" icon={<PieChartIcon size={16} />}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                    {catPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ResultSection>
        )}

        {data.par_periodicite && data.par_periodicite.length > 0 && (
          <ResultSection title="Par périodicité" icon={<Clock size={16} />}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.par_periodicite} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="periodicite" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                  <Bar dataKey="total" name="Taxes" radius={[8, 8, 0, 0]} maxBarSize={50}>
                    {data.par_periodicite.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ResultSection>
        )}
      </div>

      {data.collecte_par_taxe && data.collecte_par_taxe.length > 0 && (
        <ResultSection title="Collecte par taxe" icon={<DollarSign size={16} />}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Taxe</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Code</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3">Collecté (CDF)</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.collecte_par_taxe.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{t.nom}</td>
                    <td className="px-4 py-3 text-sm text-slate-500"><Badge variant="neutral">{t.code}</Badge></td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">{formatCdf(t.total_collecte)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ResultSection>
      )}
    </div>
  );
}

function FacturesReport({ data }: { data: RapportData }) {
  const statutPieData = (data.par_statut ?? []).map(s => ({
    name: statutBadge[s.statut ?? '']?.label ?? s.statut ?? '',
    value: s.total,
    color: statutColors[s.statut ?? ''] ?? '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText size={20} />} label="Total factures" value={formatNumber(data.total ?? 0)} color="from-purple-500 to-purple-600" />
        <StatCard icon={<DollarSign size={20} />} label="Montant TTC" value={formatCdf(data.montant_total ?? 0)} color="from-indigo-500 to-indigo-600" />
        <StatCard icon={<CreditCard size={20} />} label="Montant HT" value={formatCdf(data.montant_ht ?? 0)} color="from-emerald-500 to-emerald-600" />
        <StatCard icon={<TrendingUp size={20} />} label="Montant moyen" value={formatCdf(data.montant_moyen ?? 0)} color="from-amber-500 to-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statutPieData.length > 0 && (
          <ResultSection title="Répartition par statut" icon={<PieChartIcon size={16} />}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statutPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                    {statutPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ResultSection>
        )}

        {data.par_statut && data.par_statut.length > 0 && (
          <ResultSection title="Montant par statut" icon={<BarChart3 size={16} />}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.par_statut.map(s => ({ name: statutBadge[s.statut ?? '']?.label ?? s.statut ?? '', montant: s.montant ?? 0, total: s.total }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCdf(v)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                  <Bar dataKey="montant" name="Montant CDF" radius={[8, 8, 0, 0]} maxBarSize={50}>
                    {data.par_statut!.map((s: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={statutColors[s.statut ?? ''] ?? chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ResultSection>
        )}
      </div>

      {data.evolution && data.evolution.length > 0 && (
        <ResultSection title="Évolution de la facturation" icon={<TrendingUp size={16} />}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.evolution.map(e => ({ ...e, name: formatMonth(e.mois ?? e.periode ?? '') }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCdf(v)} />
                <Tooltip content={<ChartTooltip />} />
                <defs><linearGradient id="colorFacture" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="montant" name="Montant CDF" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorFacture)" dot={{ fill: '#8b5cf6', r: 4 }} />
                <Line type="monotone" dataKey="total" name="Factures" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ResultSection>
      )}
    </div>
  );
}

function GlobalReport({ data }: { data: RapportData }) {
  return (
    <div className="space-y-6">
      {data.resume && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users size={20} />} label="Total opérateurs" value={formatNumber(data.resume.total_operateurs ?? 0)} color="from-indigo-500 to-indigo-600" />
          <StatCard icon={<DollarSign size={20} />} label="Total collecté" value={formatCdf(data.resume.total_collecte ?? 0)} color="from-emerald-500 to-emerald-600" />
          <StatCard icon={<FileText size={20} />} label="Total factures" value={formatNumber(data.resume.total_factures ?? 0)} color="from-purple-500 to-purple-600" />
          <StatCard icon={<TrendingUp size={20} />} label="Taux recouvrement" value={`${data.resume.taux_recouvrement_global ?? 0}%`} color="from-amber-500 to-amber-600" />
        </div>
      )}

      {data.operateurs && (
        <ResultSection title="Section Opérateurs" icon={<Users size={16} />}>
          <OperateursReport data={data.operateurs} />
        </ResultSection>
      )}

      {data.paiements && (
        <ResultSection title="Section Paiements" icon={<Receipt size={16} />}>
          <PaiementsReport data={data.paiements} />
        </ResultSection>
      )}

      {data.taxes && (
        <ResultSection title="Section Taxes" icon={<FileText size={16} />}>
          <TaxesReport data={data.taxes} />
        </ResultSection>
      )}

      {data.factures && (
        <ResultSection title="Section Factures" icon={<FileText size={16} />}>
          <FacturesReport data={data.factures} />
        </ResultSection>
      )}
    </div>
  );
}

export default function Rapports() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RapportData | null>(null);
  const [periodeDebut, setPeriodeDebut] = useState('');
  const [periodeFin, setPeriodeFin] = useState('');

  const handleGenerer = async () => {
    if (!selected) { toast.error('Sélectionnez un type de rapport'); return; }
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = { type: selected };
      if (periodeDebut) body.periode_debut = periodeDebut;
      if (periodeFin) body.periode_fin = periodeFin;
      const res = await post('/rapports/generer', body);
      setResult(res as RapportData);
      toast.success('Rapport généré avec succès');
    } catch {
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => { window.print(); };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition";

  const renderReport = () => {
    if (!result) return null;
    if (result.operateurs && result.paiements) return <GlobalReport data={result} />;
    if (result.par_commune || result.formalises !== undefined) return <OperateursReport data={result} />;
    if (result.par_statut && (result.montant_paye !== undefined || result.montant_en_attente !== undefined)) return <PaiementsReport data={result} />;
    if (result.par_categorie || result.collecte_par_taxe) return <TaxesReport data={result} />;
    if (result.montant_ht !== undefined || result.montant_moyen !== undefined) return <FacturesReport data={result} />;
    return <OperateursReport data={result} />;
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-xl opacity-30" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
              <BarChart3 className="text-white" size={22} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rapports personnalisés</h1>
            <p className="text-sm text-slate-500 mt-0.5">Générez et visualisez des rapports détaillés</p>
          </div>
        </div>
        {result && (
          <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm cursor-pointer">
            <Download size={16} />
            Imprimer / PDF
          </button>
        )}
      </div>

      {/* Rapport Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        {rapportTypes.map((r) => {
          const Icon = r.icon;
          const isActive = selected === r.key;
          return (
            <button key={r.key} onClick={() => setSelected(r.key)}
              className={`text-left rounded-2xl border-2 p-5 transition-all cursor-pointer ${isActive ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon size={18} />
                </span>
                <h3 className="text-sm font-bold text-slate-900">{r.label}</h3>
              </div>
              <p className="text-xs text-slate-500">{r.description}</p>
            </button>
          );
        })}
      </div>

      {/* Parameters */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6 print:hidden">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Paramètres du rapport</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Date début</label>
            <input type="date" value={periodeDebut} onChange={(e) => setPeriodeDebut(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Date fin</label>
            <input type="date" value={periodeFin} onChange={(e) => setPeriodeFin(e.target.value)} className={inputClass} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerer} disabled={!selected || loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Génération...</span>
              ) : (
                <span className="flex items-center gap-2"><BarChart3 size={16} /> Générer le rapport</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <Skeleton width={48} height={48} borderRadius={12} />
                  <div className="flex-1"><Skeleton width="60%" height={12} /><Skeleton width="80%" height={24} className="mt-2" /></div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm"><Skeleton width="40%" height={20} /><Skeleton width="100%" height={250} className="mt-4" /></div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm"><Skeleton width="40%" height={20} /><Skeleton width="100%" height={250} className="mt-4" /></div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && renderReport()}

      {/* Empty State */}
      {!result && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={36} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucun rapport généré</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Sélectionnez un type de rapport ci-dessus et cliquez sur « Générer le rapport » pour visualiser les statistiques.
          </p>
        </div>
      )}
    </div>
  );
}
