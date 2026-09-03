import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Settings, Save, Lock, Unlock } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { StatsSkeleton } from '../components/ui/Skeletons';
import { parametreService } from '../services/parametreService';
import type { Parametre } from '../types';

export default function Parametres() {
  const [parametres, setParametres] = useState<Parametre[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [stats, setStats] = useState({ total: 0, modifiables: 0, nonModifiables: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const res = await parametreService.list({ per_page: 9999 });
      const items = res.data ?? [];
      setParametres(items);

      const values: Record<string, string> = {};
      items.forEach((p) => { values[p.cle] = p.valeur; });
      setEditValues(values);

      const modifiables = items.filter((p) => p.est_modifiable).length;
      setStats({ total: items.length, modifiables, nonModifiables: items.length - modifiables });
    } catch {
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleValueChange = (cle: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [cle]: value }));
  };

  const handleSave = async (param: Parametre) => {
    setSavingId(param.cle);
    try {
      await parametreService.updateByCle(param.cle, { valeur: editValues[param.cle] });
      toast.success(`Paramètre "${param.cle}" mis à jour`);
      fetchAll();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        subtitle="Configuration du système"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total paramètres" value={stats.total} icon={<Settings size={22} />} color="primary" loading={statsLoading} />
        <StatCard title="Modifiables" value={stats.modifiables} icon={<Unlock size={22} />} color="success" loading={statsLoading} />
        <StatCard title="Non modifiables" value={stats.nonModifiables} icon={<Lock size={22} />} color="warning" loading={statsLoading} />
      </div>

      {loading ? <StatsSkeleton count={3} /> : parametres.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Settings size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm text-slate-500">Aucun paramètre trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parametres.map((param) => (
            <div
              key={param.cle}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {param.est_modifiable ? (
                    <Unlock size={14} className="text-emerald-500" />
                  ) : (
                    <Lock size={14} className="text-slate-400" />
                  )}
                  <h3 className="text-sm font-semibold text-slate-800 font-mono">{param.cle}</h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  param.est_modifiable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {param.est_modifiable ? 'Modifiable' : 'Lecture seule'}
                </span>
              </div>

              {param.description && (
                <p className="text-xs text-slate-500 mb-3">{param.description}</p>
              )}

              <div className="mt-auto">
                {param.est_modifiable ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editValues[param.cle] ?? ''}
                      onChange={(e) => handleValueChange(param.cle, e.target.value)}
                      className="flex-1"
                      placeholder="Valeur"
                    />
                    <Button
                      size="sm"
                      icon={<Save size={14} />}
                      onClick={() => handleSave(param)}
                      loading={savingId === param.cle}
                      disabled={editValues[param.cle] === param.valeur}
                    >
                      Sauver
                    </Button>
                  </div>
                ) : (
                  <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800">
                    {param.valeur}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
