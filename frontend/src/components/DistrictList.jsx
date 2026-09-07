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

  useEffect(() => {
    if (selectedZoneId && rowRefs.current[selectedZoneId]) {
      rowRefs.current[selectedZoneId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedZoneId]);

  const getRiskColorClass = (category) => {
    switch (category) {
      case 'CRITICAL': return 'bg-rose-500 text-white animate-critical-pulse';
      case 'HIGH': return 'bg-amber-500 text-white';
      case 'MODERATE': return 'bg-amber-400 text-slate-900';
      case 'LOW': return 'bg-emerald-500 text-white';
      default: return 'bg-sky-500 text-white';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm overflow-hidden min-h-[250px]">
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">
          District Risk Status
        </h2>
        <span className="text-[10.5px] text-slate-500">
          Click district to zoom map
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sortedEntries.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-8">Loading Tamil Nadu districts…</div>
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
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 shadow-sm -translate-y-0.5'
                    : 'bg-white border-slate-200/80 hover:border-sky-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs md:text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span>{z.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    <span>{s.disaster_type} • {(s.confidence * 100).toFixed(0)}% conf</span>
                    {w && (
                      <span className="text-sky-600 font-medium ml-1.5">
                        🌡️ {w.temperature_c}°C • 💨 {w.wind_speed_kmh}km/h
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRiskColorClass(s.risk_category)}`}>
                    {s.risk_category} {s.risk_score}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSimulate(z.id);
                    }}
                    className="bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="Simulate disaster crisis spike"
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
