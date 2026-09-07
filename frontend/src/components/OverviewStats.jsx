import React from 'react';
import { ShieldCheck, AlertTriangle, Flame, Home } from 'lucide-react';

export default function OverviewStats({ summary }) {
  const stats = [
    {
      id: 'zones',
      label: 'Districts Monitored',
      value: summary?.zones_monitored ?? 18,
      icon: ShieldCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50/80',
      border: 'border-sky-100'
    },
    {
      id: 'alerts',
      label: 'Total Alerts',
      value: summary?.total_alerts ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50/80',
      border: 'border-amber-100'
    },
    {
      id: 'critical',
      label: 'Critical Alerts',
      value: summary?.critical_alerts ?? 0,
      icon: Flame,
      color: 'text-rose-600',
      bg: 'bg-rose-50/80',
      border: 'border-rose-100'
    },
    {
      id: 'shelters',
      label: 'Shelters Available',
      value: summary?.shelters_available ?? 31,
      icon: Home,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-100'
    },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm">
      <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 px-1">
        Platform Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className={`${s.bg} border ${s.border} rounded-xl p-3 text-center flex flex-col items-center justify-center transition-all hover:shadow-sm`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <span className={`text-xl md:text-2xl font-black ${s.color}`}>
                  {s.value}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
