import React from 'react';
import { Radio, Bell } from 'lucide-react';

function timeAgo(isoString) {
  if (!isoString) return 'just now';
  const time = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z').getTime();
  const diffSec = Math.floor((Date.now() - time) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

export default function AlertFeed({ alerts }) {
  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          border: 'border-l-rose-500',
          text: 'text-rose-600',
          badge: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      case 'HIGH':
        return {
          border: 'border-l-amber-500',
          text: 'text-amber-600',
          badge: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'MODERATE':
        return {
          border: 'border-l-amber-400',
          text: 'text-amber-600',
          badge: 'bg-amber-50 text-amber-600 border-amber-200'
        };
      default:
        return {
          border: 'border-l-emerald-500',
          text: 'text-emerald-600',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm overflow-hidden min-h-[250px]">
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-sky-500" />
          <span>Alert Feed &amp; Dispatched Resources</span>
        </h2>
        {alerts.length > 0 && (
          <span className="text-[10.5px] text-sky-700 font-bold px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200">
            {alerts.length} Active
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {alerts.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-8">
            No active emergency alerts. All monitored parameters normal.
          </div>
        ) : (
          alerts.map((a, idx) => {
            const style = getSeverityStyle(a.severity);
            return (
              <div
                key={a.id || idx}
                className={`bg-white border border-slate-200 border-l-4 ${style.border} rounded-xl p-3 text-xs shadow-xs transition-all`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold uppercase tracking-wide text-[11px] ${style.text}`}>
                    {a.severity} — {a.disaster_type}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {timeAgo(a.timestamp)}
                  </span>
                </div>
                <div className="text-slate-700 text-[12px] leading-relaxed mb-2">
                  {a.message}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-sky-600 font-medium pt-1.5 border-t border-slate-100">
                  <Radio className="w-3 h-3 text-sky-500 shrink-0" />
                  <span>
                    Dispatched via: <strong>{a.channels?.join(', ') || 'STATE-BROADCAST'}</strong>
                  </span>
                  {a.population_affected && (
                    <span className="text-slate-400 ml-auto">
                      👥 {a.population_affected.toLocaleString()} affected
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
