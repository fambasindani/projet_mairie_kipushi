import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton width={40} height={40} borderRadius={12} />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600">
          <Skeleton width={22} height={22} circle />
        </div>
        <div>
          <Skeleton width={200} height={28} />
          <Skeleton width={280} height={14} className="mt-2" />
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Skeleton width={32} height={32} borderRadius={12} />
              <Skeleton width={140} height={14} />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton height={40} borderRadius={8} />
                <Skeleton height={40} borderRadius={8} />
                <Skeleton height={40} borderRadius={8} />
                <Skeleton height={40} borderRadius={8} />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <Skeleton width={32} height={32} borderRadius={12} />
              <Skeleton width={180} height={14} />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton height={40} borderRadius={8} />
                <Skeleton height={40} borderRadius={8} />
                <Skeleton height={40} borderRadius={8} />
                <Skeleton height={40} borderRadius={8} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Skeleton width={100} height={36} borderRadius={8} />
            <Skeleton width={120} height={36} borderRadius={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton width={40} height={40} borderRadius={12} />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600">
          <Skeleton width={22} height={22} circle />
        </div>
        <div>
          <Skeleton width={250} height={28} />
          <Skeleton width={200} height={14} className="mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
            <Skeleton width={180} height={16} className="mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton width={100} height={12} />
                  <Skeleton width="60%" height={14} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
            <Skeleton width={160} height={16} className="mb-6" />
            <div className="space-y-4">
              <Skeleton height={12} />
              <Skeleton height={12} />
              <Skeleton height={12} />
            </div>
          </div>
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
            <Skeleton width={160} height={16} className="mb-6" />
            <div className="space-y-3">
              <Skeleton height={12} />
              <Skeleton height={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center gap-4">
            <Skeleton width={48} height={48} borderRadius={16} />
            <div className="flex-1">
              <Skeleton width={80} height={14} />
              <Skeleton width={120} height={24} className="mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
