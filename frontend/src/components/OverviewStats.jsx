import React from 'react';
import { ShieldCheck, AlertTriangle, Flame, Home } from 'lucide-react';

export default function OverviewStats({ summary }) {
  const stats = [
    {
      id: 'zones',
      label: 'Districts Monitored',
      value: summary?.zones_monitored ?? 18,
      icon: ShieldCheck,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20'
    },
    {
      id: 'alerts',
      label: 'Total Alerts',
      value: summary?.total_alerts ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    {
      id: 'critical',
      label: 'Critical Alerts',
      value: summary?.critical_alerts ?? 0,
      icon: Flame,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20'
    },
    {
      id: 'shelters',
      label: 'Shelters Available',
      value: summary?.shelters_available ?? 31,
      icon: Home,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
  ];

  return (
    <div className="bg-panel border border-border rounded-xl p-3.5 shadow-lg">
      <h2 className="text-xs uppercase tracking-wider font-bold text-muted mb-2.5 px-1">
        Platform Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className={`bg-panel-2 border ${s.border} rounded-lg p-3 text-center flex flex-col items-center justify-center transition-all hover:border-accent/40`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                <span className={`text-xl md:text-2xl font-black ${s.color}`}>
                  {s.value}
                </span>
              </div>
              <div className="text-[11px] font-medium text-muted">
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
