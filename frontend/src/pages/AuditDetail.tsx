import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Shield, User, Clock, Globe, Monitor, FileText, ArrowRightLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { formatDate, formatDateTime } from '../utils/format';
import Badge from '../components/ui/Badge';
import { DetailSkeleton } from '../components/ui/Skeletons';
import { auditService } from '../services/auditService';
import type { LogAudit } from '../types';

const actionConfig: Record<string, { label: string; color: 'success' | 'info' | 'warning' | 'danger' | 'neutral'; icon: string }> = {
  CREATE: { label: 'Création', color: 'success', icon: '➕' },
  UPDATE: { label: 'Modification', color: 'info', icon: '✏️' },
  DELETE: { label: 'Suppression', color: 'danger', icon: '🗑️' },
  LOGIN: { label: 'Connexion', color: 'warning', icon: '🔑' },
  LOGOUT: { label: 'Déconnexion', color: 'neutral', icon: '🚪' },
  TOGGLE: { label: 'Basculement', color: 'warning', icon: '🔄' },
};

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [log, setLog] = useState<LogAudit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    auditService.get(Number(id))
      .then((data) => { setLog(data); setLoading(false); })
      .catch(() => { toast.error('Log non trouvé'); navigate('/audit'); });
  }, [id, navigate]);

  const formatJson = (data: Record<string, unknown> | null) => {
    if (!data || Object.keys(data).length === 0) {
      return <span className="text-sm text-slate-300 italic">Aucune donnée</span>;
    }
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
        <pre className="text-xs text-slate-700 p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  const DiffView = ({ oldData, newData }: { oldData: Record<string, unknown> | null; newData: Record<string, unknown> | null }) => {
    const keys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    if (keys.size === 0) return <span className="text-sm text-slate-300 italic">Aucune modification</span>;

    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {Array.from(keys).filter(k => k !== 'updated_at' && k !== 'created_at').map((key) => {
          const oldVal = oldData?.[key];
          const newVal = newData?.[key];
          const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
          if (!changed) return null;
          return (
            <div key={key} className="grid grid-cols-[180px_1fr_40px_1fr] gap-0 items-stretch">
              <div className="px-4 py-3 bg-slate-50 border-r border-slate-200 flex items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{key}</span>
              </div>
              <div className="px-4 py-3 bg-red-50/50">
                <span className="text-sm text-red-700 font-mono">{oldVal !== undefined && oldVal !== null ? String(oldVal) : '—'}</span>
              </div>
              <div className="flex items-center justify-center bg-slate-50 border-x border-slate-200">
                <ArrowRightLeft size={14} className="text-slate-400" />
              </div>
              <div className="px-4 py-3 bg-emerald-50/50">
                <span className="text-sm text-emerald-700 font-mono">{newVal !== undefined && newVal !== null ? String(newVal) : '—'}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <DetailSkeleton />;

  if (!log) return null;

  const config = actionConfig[log.action] ?? { label: log.action, color: 'neutral' as const, icon: '📋' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/audit')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Shield className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Log d'audit #{log.id}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={config.color}>{config.icon} {config.label}</Badge>
              <span className="text-sm text-slate-400">sur</span>
              <Badge variant="info">{log.table_cible}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Utilisateur</p>
            <p className="text-sm font-semibold text-slate-900">{log.utilisateur?.nom_utilisateur ?? 'Système'}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Enregistrement</p>
            <p className="text-sm font-semibold text-slate-900">#{log.enregistrement_id ?? '—'}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Date</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatDateTime(log.created_at)}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <Globe size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Adresse IP</p>
            <p className="text-sm font-semibold text-slate-900">{log.adresse_ip ?? '—'}</p>
          </div>
        </div>
      </div>

      {(log.anciennes_valeurs || log.nouvelles_valeurs) && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <ArrowRightLeft className="text-sm" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Comparaison des données</h3>
          </div>
          <DiffView oldData={log.anciennes_valeurs} newData={log.nouvelles_valeurs} />
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Monitor className="text-sm" />
          </span>
          <h3 className="text-sm font-bold text-slate-900">Informations techniques</h3>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">User Agent</p>
              <p className="text-xs text-slate-600 font-mono break-all leading-relaxed">{log.user_agent ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Timestamp complet</p>
              <p className="text-xs text-slate-600 font-mono">{formatDateTime(log.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {log.action === 'DELETE' && log.anciennes_valeurs && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <FileText className="text-sm" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Données supprimées</h3>
          </div>
          {formatJson(log.anciennes_valeurs)}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => navigate('/audit')}>Retour à la liste</Button>
      </div>
    </div>
  );
}
