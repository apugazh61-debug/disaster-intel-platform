import React, { useEffect, useRef } from 'react';
import { MapPin, Zap } from 'lucide-react';

export default function DistrictList({
  zones,
  zoneStates,
  selectedZoneId,
  onSelectDistrict,
  onSimulate
}) {
  const rowRefs = useRef({});

  // Sort zones by risk score descending
  const sortedEntries = zones.map(z => {
    const s = zoneStates[z.id] || {
      zone_id: z.id,
      zone_name: z.name,
      disaster_type: 'MONITORING',
      risk_score: 15.0,
      risk_category: 'LOW',
      confidence: 0.70,
    };
    return { ...z, state: s };
  }).sort((a, b) => b.state.risk_score - a.state.risk_score);

  // Auto scroll to active district
  useEffect(() => {
    if (selectedZoneId && rowRefs.current[selectedZoneId]) {
      rowRefs.current[selectedZoneId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedZoneId]);

  const getRiskColorClass = (category) => {
    switch (category) {
      case 'CRITICAL': return 'bg-critical text-white shadow-[0_0_10px_rgba(231,76,60,0.6)] animate-critical-pulse';
      case 'HIGH': return 'bg-high text-black font-bold';
      case 'MODERATE': return 'bg-moderate text-black font-bold';
      case 'LOW': return 'bg-low text-black font-bold';
      default: return 'bg-accent text-black font-bold';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-panel border border-border rounded-xl p-3.5 overflow-hidden shadow-lg min-h-[260px]">
      <div className="flex justify-between items-center mb-2 px-1">
        <h2 className="text-xs uppercase tracking-wider font-bold text-muted">
          District Risk Status
        </h2>
        <span className="text-[10px] text-muted">
          Click district to view on map
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sortedEntries.length === 0 ? (
          <div className="text-center text-xs text-muted py-8">Loading Tamil Nadu districts…</div>
        ) : (
          sortedEntries.map((item) => {
            const z = item;
            const s = item.state;
            const w = s.weather_info;
            const isSelected = selectedZoneId === z.id;

            return (
              <div
                key={z.id}
                ref={(el) => (rowRefs.current[z.id] = el)}
                onClick={() => onSelectDistrict(z.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-accent bg-[#1a273a] shadow-[0_0_12px_rgba(62,166,255,0.35)] -translate-y-0.5'
                    : 'bg-panel-2 border-border hover:border-accent/60 hover:bg-panel-hover'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs md:text-sm font-semibold text-white truncate flex items-center gap-1">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-accent' : 'text-muted'}`} />
                    <span>{z.name}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 truncate">
                    <span>{s.disaster_type} • {(s.confidence * 100).toFixed(0)}% conf</span>
                    {w && (
                      <span className="text-sky-400 font-medium ml-1.5">
                        🌡️ {w.temperature_c}°C • 💨 {w.wind_speed_kmh}km/h
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRiskColorClass(s.risk_category)}`}>
                    {s.risk_category} {s.risk_score}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSimulate(z.id);
                    }}
                    className="bg-accent hover:bg-accent/80 text-[#04141f] text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-opacity cursor-pointer"
                    title="Trigger a disaster spike simulation on this district"
                  >
                    <Zap className="w-2.5 h-2.5" />
                    <span>Spike</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
