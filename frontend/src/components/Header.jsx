import React, { useState, useRef, useEffect } from 'react';
import { Search, X, RotateCw, MapPin, Zap, Satellite, Globe2, Radio } from 'lucide-react';

export default function Header({
  systemMode,
  onToggleMode,
  onSyncSatellite,
  isSyncing,
  onResetView,
  zones,
  zoneStates,
  onSelectDistrict,
  wsConnected
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchWrapperRef = useRef(null);

  // Close dropdown on click outside
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
      case 'CRITICAL': return 'bg-critical text-white shadow-[0_0_10px_rgba(231,76,60,0.6)] animate-pulse';
      case 'HIGH': return 'bg-high text-black font-bold';
      case 'MODERATE': return 'bg-moderate text-black font-bold';
      case 'LOW': return 'bg-low text-black font-bold';
      default: return 'bg-accent text-black font-bold';
    }
  };

  const isLive = systemMode === 'LIVE_OPEN_METEO';

  return (
    <header className="flex flex-wrap items-center justify-between px-6 py-3 bg-gradient-to-r from-[#0d1b2a] via-[#101c2b] to-[#12202f] border-b border-border gap-4 select-none z-30">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <span className="bg-accent/20 border border-accent/40 text-accent text-[11px] font-black tracking-wider px-2.5 py-1 rounded-full uppercase shadow-[0_0_12px_rgba(62,166,255,0.3)]">
          ECO-SHIELD
        </span>
        <h1 className="text-sm md:text-base font-bold text-white tracking-wide flex items-center gap-2 m-0 whitespace-nowrap">
          AI Disaster Intelligence &amp; Response
        </h1>
      </div>

      {/* Statewide Search Bar */}
      <div ref={searchWrapperRef} className="relative flex-1 max-w-[500px] min-w-[260px]">
        <div className="flex items-center bg-panel-2 border border-border rounded-full px-3.5 py-1.5 gap-2.5 transition-all duration-200 focus-within:border-accent focus-within:bg-[#182230] focus-within:shadow-[0_0_14px_rgba(62,166,255,0.35)]">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            className="bg-transparent border-none outline-none text-text text-xs md:text-sm w-full placeholder:text-[#728498]"
            placeholder="Search District (e.g. Nilgiris, Cuddalore, Madurai...)"
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
            <button
              onClick={handleClear}
              className="text-muted hover:text-white p-0.5 rounded transition-colors"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#121820]/98 backdrop-blur-md border border-border rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-white/5">
            {filteredZones.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted">
                No district matching "{searchQuery}"
              </div>
            ) : (
              filteredZones.map((z) => {
                const state = zoneStates[z.id] || { risk_category: 'LOW', risk_score: 10, disaster_type: 'MONITORING' };
                const w = state.weather_info;
                return (
                  <div
                    key={z.id}
                    onClick={() => handleSelect(z.id, z.name)}
                    className="p-3 hover:bg-panel-hover cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs md:text-sm font-semibold text-white flex items-center gap-1.5 group-hover:text-accent transition-colors">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        {z.name}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">
                        {state.disaster_type} • Pop: {z.population.toLocaleString()}
                        {w && <span className="text-sky-400 font-medium"> • 🌡️ {w.temperature_c}°C</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRiskColorClass(state.risk_category)}`}>
                      {state.risk_category} {state.risk_score}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Header Actions & Mode Toggles */}
      <div className="flex items-center gap-2.5 whitespace-nowrap">
        {/* Satellite Mode Badge */}
        <div
          className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
            isLive
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(46,204,113,0.25)]'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(243,156,18,0.25)]'
          }`}
          title="Open-Meteo High-Resolution Satellite Live Observation Feed"
        >
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              isLive ? 'bg-emerald-400 shadow-[0_0_6px_#2ecc71] animate-live-pulse' : 'bg-amber-400 shadow-[0_0_6px_#f39c12] animate-live-pulse'
            }`}
          />
          <span>{isLive ? 'LIVE SATELLITE (Open-Meteo)' : 'SIMULATION DRILL'}</span>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={onToggleMode}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            isLive
              ? 'bg-[#162436] border-accent text-accent hover:bg-accent hover:text-[#04141f] shadow-[0_0_8px_rgba(62,166,255,0.2)]'
              : 'bg-[#291e13] border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-[#180f05] shadow-[0_0_8px_rgba(245,158,11,0.2)]'
          }`}
          title="Switch between Live Satellite Feed and Crisis Simulation Drill"
        >
          {isLive ? <Zap className="w-3.5 h-3.5" /> : <Satellite className="w-3.5 h-3.5" />}
          {isLive ? '⚡ Test Drill' : '🛰️ Live Satellite'}
        </button>

        {/* Sync Button */}
        <button
          onClick={onSyncSatellite}
          disabled={isSyncing}
          className="bg-panel-2 border border-border hover:border-accent hover:text-accent text-text text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          title="Re-sync latest real-time weather telemetry from Open-Meteo"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-accent' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : '🔄 Sync'}</span>
        </button>

        {/* Whole TN Reset */}
        <button
          onClick={onResetView}
          className="bg-panel-2 border border-border hover:border-accent hover:text-accent text-text text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          title="Reset map view to whole Tamil Nadu state"
        >
          <Globe2 className="w-3.5 h-3.5 text-accent" />
          <span>🗺️ Whole TN</span>
        </button>

        {/* Live WS Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted pl-1">
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              wsConnected ? 'bg-low shadow-[0_0_6px_#2ecc71]' : 'bg-critical shadow-[0_0_6px_#e74c3c]'
            }`}
          />
          <span className="text-[11px]">{wsConnected ? 'Live feed connected' : 'Disconnected'}</span>
        </div>
      </div>
    </header>
  );
}
