import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  RotateCw,
  MapPin,
  Zap,
  Satellite,
  Globe2,
  AlertOctagon,
  Navigation,
  ShieldAlert,
  Shield,
  Volume2,
  VolumeX,
  LogIn,
  LogOut
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
  onOpenSos,
  onOpenSafeRoute,
  onOpenHazard,
  onOpenOfficerLogin,
  onOpenOfficerDeck,
  officerUser,
  onLogoutOfficer,
  voiceEnabled,
  onToggleVoice
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
      case 'CRITICAL': return 'bg-critical text-white shadow-[0_0_10px_rgba(231,76,60,0.6)] animate-pulse';
      case 'HIGH': return 'bg-high text-black font-bold';
      case 'MODERATE': return 'bg-moderate text-black font-bold';
      case 'LOW': return 'bg-low text-black font-bold';
      default: return 'bg-accent text-black font-bold';
    }
  };

  const isLive = systemMode === 'LIVE_OPEN_METEO';

  return (
    <header className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-gradient-to-r from-[#0d1b2a] via-[#101c2b] to-[#12202f] border-b border-border gap-3 select-none z-30">
      {/* Brand & Title */}
      <div className="flex items-center gap-2.5">
        <span className="bg-accent/20 border border-accent/40 text-accent text-[11px] font-black tracking-wider px-2.5 py-1 rounded-full uppercase shadow-[0_0_12px_rgba(62,166,255,0.3)]">
          ECO-SHIELD
        </span>
        <h1 className="text-sm md:text-base font-bold text-white tracking-wide flex items-center gap-2 m-0 whitespace-nowrap">
          AI Disaster Intelligence &amp; Response
        </h1>
      </div>

      {/* Statewide Search Bar */}
      <div ref={searchWrapperRef} className="relative flex-1 max-w-[380px] min-w-[220px]">
        <div className="flex items-center bg-panel-2 border border-border rounded-full px-3 py-1.5 gap-2 transition-all duration-200 focus-within:border-accent focus-within:bg-[#182230] focus-within:shadow-[0_0_12px_rgba(62,166,255,0.3)]">
          <Search className="w-3.5 h-3.5 text-muted shrink-0" />
          <input
            type="text"
            className="bg-transparent border-none outline-none text-text text-xs w-full placeholder:text-[#728498]"
            placeholder="Search District (e.g. Nilgiris, Madurai...)"
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
            <button onClick={handleClear} className="text-muted hover:text-white p-0.5 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isDropdownOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#121820]/98 backdrop-blur-md border border-border rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-white/5">
            {filteredZones.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted">No district matching "{searchQuery}"</div>
            ) : (
              filteredZones.map((z) => {
                const state = zoneStates[z.id] || { risk_category: 'LOW', risk_score: 10, disaster_type: 'MONITORING' };
                const w = state.weather_info;
                return (
                  <div
                    key={z.id}
                    onClick={() => handleSelect(z.id, z.name)}
                    className="p-2.5 hover:bg-panel-hover cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1 group-hover:text-accent">
                        <MapPin className="w-3 h-3 text-accent" />
                        {z.name}
                      </div>
                      <div className="text-[10.5px] text-muted mt-0.5">
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

      {/* Citizen Life-Saving Quick Buttons */}
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {/* Citizen SOS Button */}
        <button
          onClick={onOpenSos}
          className="bg-critical/20 hover:bg-critical border border-critical text-critical hover:text-white font-black text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_14px_rgba(231,76,60,0.4)] animate-pulse transition-all cursor-pointer"
          title="Citizen Emergency SOS Distress Dispatch"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>🚨 Citizen SOS</span>
        </button>

        {/* AI Safe Route Button */}
        <button
          onClick={onOpenSafeRoute}
          className="bg-emerald-500/15 hover:bg-emerald-500 border border-emerald-500/40 text-emerald-400 hover:text-[#04141f] font-bold text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          title="Calculate safe evacuation route to nearest shelter"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>🗺️ Safe Route</span>
        </button>

        {/* Report Hazard Button */}
        <button
          onClick={onOpenHazard}
          className="bg-amber-500/15 hover:bg-amber-500 border border-amber-500/40 text-amber-400 hover:text-[#04141f] font-bold text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          title="Crowdsource localized road block or live wire hazard"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>📢 Report Hazard</span>
        </button>

        {/* Tamil Voice Alert Synthesizer Toggle */}
        <button
          onClick={onToggleVoice}
          className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
            voiceEnabled
              ? 'bg-accent/20 border-accent text-accent shadow-[0_0_8px_rgba(62,166,255,0.4)]'
              : 'bg-panel-2 border-border text-muted hover:text-white'
          }`}
          title={voiceEnabled ? 'Tamil Emergency Voice Speech Enabled' : 'Tamil Emergency Voice Speech Muted'}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Header Actions: Mode Toggle, Sync, Whole TN, Officer Login */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        {/* Satellite Mode Badge */}
        <div
          className={`flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-full border transition-all ${
            isLive
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full inline-block ${
              isLive ? 'bg-emerald-400 shadow-[0_0_6px_#2ecc71] animate-live-pulse' : 'bg-amber-400 shadow-[0_0_6px_#f39c12] animate-live-pulse'
            }`}
          />
          <span>{isLive ? 'LIVE SATELLITE' : 'SIM DRILL'}</span>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={onToggleMode}
          className={`text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
            isLive
              ? 'bg-[#162436] border-accent text-accent hover:bg-accent hover:text-[#04141f]'
              : 'bg-[#291e13] border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-[#180f05]'
          }`}
        >
          {isLive ? <Zap className="w-3 h-3" /> : <Satellite className="w-3 h-3" />}
          {isLive ? '⚡ Drill' : '🛰️ Satellite'}
        </button>

        {/* Sync Button */}
        <button
          onClick={onSyncSatellite}
          disabled={isSyncing}
          className="bg-panel-2 border border-border hover:border-accent hover:text-accent text-text text-[10.5px] font-semibold px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-accent' : ''}`} />
          <span>{isSyncing ? '...' : '🔄 Sync'}</span>
        </button>

        {/* Whole TN Reset */}
        <button
          onClick={onResetView}
          className="bg-panel-2 border border-border hover:border-accent hover:text-accent text-text text-[10.5px] font-semibold px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
        >
          <Globe2 className="w-3 h-3 text-accent" />
          <span>Whole TN</span>
        </button>

        {/* Officer Access Portal / Badge */}
        {officerUser ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenOfficerDeck}
              className="bg-accent/15 border border-accent/40 text-accent hover:bg-accent hover:text-[#04141f] text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(62,166,255,0.25)] cursor-pointer"
              title="Open Officer Command Deck"
            >
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>{officerUser.role === 'ADMIN' ? '🛡️ Admin Deck' : `🏛️ ${officerUser.username}`}</span>
            </button>
            <button
              onClick={onLogoutOfficer}
              className="text-muted hover:text-critical p-1 rounded transition-colors"
              title="Sign Out of Officer Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenOfficerLogin}
            className="bg-panel-2 border border-border hover:border-accent text-text hover:text-accent text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            title="Authenticate as District Collector or TNDRF Commander"
          >
            <LogIn className="w-3 h-3 text-accent" />
            <span>🔐 Officer Portal</span>
          </button>
        )}
      </div>
    </header>
  );
}
