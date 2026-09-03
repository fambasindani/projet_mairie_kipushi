import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
}

const colorClasses: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
  success: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-600' },
  danger: { bg: 'bg-red-100', text: 'text-red-600' },
  info: { bg: 'bg-blue-100', text: 'text-blue-600' },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  loading = false,
}) => {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center gap-4">
          <Skeleton width={48} height={48} borderRadius={16} />
          <div className="flex-1">
            <Skeleton width={80} height={14} />
            <Skeleton width={120} height={24} className="mt-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 truncate">{title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
