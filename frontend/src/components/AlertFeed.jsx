import React from 'react';
import { Radio, AlertOctagon, Bell } from 'lucide-react';

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
          border: 'border-l-critical',
          text: 'text-critical',
          badge: 'bg-critical/20 text-critical border-critical/40'
        };
      case 'HIGH':
        return {
          border: 'border-l-high',
          text: 'text-high',
          badge: 'bg-high/20 text-high border-high/40'
        };
      case 'MODERATE':
        return {
          border: 'border-l-moderate',
          text: 'text-moderate',
          badge: 'bg-moderate/20 text-moderate border-moderate/40'
        };
      default:
        return {
          border: 'border-l-low',
          text: 'text-low',
          badge: 'bg-low/20 text-low border-low/40'
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-panel border border-border rounded-xl p-3.5 overflow-hidden shadow-lg min-h-[260px]">
      <div className="flex justify-between items-center mb-2 px-1">
        <h2 className="text-xs uppercase tracking-wider font-bold text-muted flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-accent" />
          <span>Alert Feed &amp; Auto-Dispatched Resources</span>
        </h2>
        {alerts.length > 0 && (
          <span className="text-[10px] text-accent font-bold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30">
            {alerts.length} Live
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {alerts.length === 0 ? (
          <div className="text-center text-xs text-muted py-8">
            No alerts yet. Monitoring statewide sensors…
          </div>
        ) : (
          alerts.map((a, idx) => {
            const style = getSeverityStyle(a.severity);
            return (
              <div
                key={a.id || idx}
                className={`bg-panel-2 border border-border border-l-4 ${style.border} rounded-lg p-2.5 text-xs shadow-md transition-all`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold uppercase tracking-wide text-[11px] ${style.text}`}>
                    {a.severity} — {a.disaster_type}
                  </span>
                  <span className="text-[10px] text-muted">
                    {timeAgo(a.timestamp)}
                  </span>
                </div>
                <div className="text-text text-[12px] leading-relaxed mb-1.5">
                  {a.message}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-accent font-medium pt-1 border-t border-white/5">
                  <Radio className="w-3 h-3 text-accent shrink-0" />
                  <span>
                    Dispatched via: <strong>{a.channels?.join(', ') || 'STATE-BROADCAST'}</strong>
                  </span>
                  {a.population_affected && (
                    <span className="text-muted ml-auto">
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
