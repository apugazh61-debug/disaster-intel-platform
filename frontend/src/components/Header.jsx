import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  RotateCw,
  MapPin,
  Zap,
  Satellite,
  Globe2,
  Send
} from 'lucide-react';

export default function Header({
  systemMode,
  onToggleMode,
  onSyncSatellite,
  isSyncing,
  onResetView,
  zones,
  zoneStates,
  onSelectDistrict,
  wsConnected,
  onOpenTelegram
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchWrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredZones = searchQuery.trim()
    ? zones.filter(z =>
        z.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        z.id.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  const handleSelect = (zoneId, zoneName) => {
    setSearchQuery(zoneName);
    setIsDropdownOpen(false);
    onSelectDistrict(zoneId);
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredZones.length > 0) {
      handleSelect(filteredZones[0].id, filteredZones[0].name);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const getRiskColorClass = (category) => {
    switch (category) {
      case 'CRITICAL': return 'bg-rose-500 text-white shadow-sm';
      case 'HIGH': return 'bg-amber-500 text-white';
      case 'MODERATE': return 'bg-amber-400 text-slate-900';
      case 'LOW': return 'bg-emerald-500 text-white';
      default: return 'bg-sky-500 text-white';
    }
  };

  const isLive = systemMode === 'LIVE_OPEN_METEO';

  return (
    <header className="flex flex-wrap items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm gap-4 select-none z-30">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <span className="bg-sky-50 border border-sky-200 text-sky-600 text-[11px] font-black tracking-wider px-2.5 py-1 rounded-full uppercase">
          ECO-SHIELD
        </span>
        <h1 className="text-sm md:text-base font-bold text-slate-800 tracking-tight flex items-center gap-2 m-0 whitespace-nowrap">
          Tamil Nadu Disaster Intelligence &amp; Response
        </h1>
      </div>

      {/* Statewide Search Bar */}
      <div ref={searchWrapperRef} className="relative flex-1 max-w-[420px] min-w-[240px]">
        <div className="flex items-center bg-slate-50/80 border border-slate-200 rounded-full px-3.5 py-1.5 gap-2 transition-all duration-200 focus-within:border-sky-500 focus-within:bg-white focus-within:shadow-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            className="bg-transparent border-none outline-none text-slate-800 text-xs w-full placeholder:text-slate-400"
            placeholder="Search District (e.g. Nilgiris, Madurai, Cuddalore...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {searchQuery && (
            <button onClick={handleClear} className="text-slate-400 hover:text-slate-700 p-0.5 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isDropdownOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto z-50 divide-y divide-slate-100">
            {filteredZones.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No district matching "{searchQuery}"</div>
            ) : (
              filteredZones.map((z) => {
                const state = zoneStates[z.id] || { risk_category: 'LOW', risk_score: 10, disaster_type: 'MONITORING' };
                const w = state.weather_info;
                return (
                  <div
                    key={z.id}
                    onClick={() => handleSelect(z.id, z.name)}
                    className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1 group-hover:text-sky-600">
                        <MapPin className="w-3 h-3 text-sky-500" />
                        {z.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {state.disaster_type} • Pop: {z.population.toLocaleString()}
                        {w && <span className="text-sky-600 font-medium"> • 🌡️ {w.temperature_c}°C</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getRiskColorClass(state.risk_category)}`}>
                      {state.risk_category} {state.risk_score}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Streamlined Actions */}
      <div className="flex items-center gap-2.5 whitespace-nowrap">
        {/* Satellite Mode Badge */}
        <div
          className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
            isLive
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
          title="Satellite Live Telemetry Source"
        >
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              isLive ? 'bg-emerald-500 animate-live-pulse' : 'bg-amber-500 animate-live-pulse'
            }`}
          />
          <span>{isLive ? 'LIVE SATELLITE' : 'SIMULATION DRILL'}</span>
        </div>

        {/* Drill Toggle Button */}
        <button
          onClick={onToggleMode}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
            isLive
              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-400'
              : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
          }`}
          title="Toggle between Live Satellite Feed and Crisis Simulation Drill"
        >
          {isLive ? <Zap className="w-3.5 h-3.5 text-sky-500" /> : <Satellite className="w-3.5 h-3.5 text-amber-600" />}
          <span>{isLive ? '⚡ Test Drill' : '🛰️ Live Satellite'}</span>
        </button>

        {/* Sync Button */}
        <button
          onClick={onSyncSatellite}
          disabled={isSyncing}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-400 text-slate-700 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          title="Re-sync latest real-time weather telemetry from Open-Meteo"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-500' : 'text-slate-500'}`} />
          <span>{isSyncing ? 'Syncing...' : '🔄 Sync'}</span>
        </button>

        {/* Whole TN Reset */}
        <button
          onClick={onResetView}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-400 text-slate-700 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          title="Reset map view to whole Tamil Nadu state"
        >
          <Globe2 className="w-3.5 h-3.5 text-sky-500" />
          <span>Whole TN</span>
        </button>

        {/* Telegram Emergency Broadcast */}
        <button
          onClick={onOpenTelegram}
          className="bg-gradient-to-r from-sky-500 to-[#229ED9] hover:from-sky-600 hover:to-[#1b8bc2] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-sky-500/20 active:scale-95"
          title="Open Telegram Emergency Broadcast Center"
        >
          <Send className="w-3.5 h-3.5 -translate-x-0.5 translate-y-0.5" />
          <span>✈️ Telegram Alerts</span>
        </button>

        {/* Connection Status */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 pl-1">
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              wsConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px]">{wsConnected ? 'Live Feed' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
}
