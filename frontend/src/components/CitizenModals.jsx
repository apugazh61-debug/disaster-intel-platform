import React, { useState } from 'react';
import {
  AlertOctagon,
  X,
  MapPin,
  Phone,
  Navigation,
  ShieldAlert,
  CheckCircle,
  LogIn,
  Key,
  User,
  Radio,
  Flame
} from 'lucide-react';

export function SosModal({ isOpen, onClose, onSosSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState('11.4120');
  const [lon, setLon] = useState('76.6980');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosResult, setSosResult] = useState(null);

  if (!isOpen) return null;

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(4));
          setLon(pos.coords.longitude.toFixed(4));
        },
        (err) => {
          console.warn('Geolocation failed, keeping default Nilgiris coordinates', err);
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/citizen/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizen_name: name || 'Emergency Caller',
          phone: phone || '9876543210',
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          emergency_note: note || 'Immediate rescue needed',
        }),
      });
      const data = await res.json();
      setSosResult(data);
      if (onSosSuccess) onSosSuccess(data);
    } catch (err) {
      console.error('SOS submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-panel border-2 border-critical/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(231,76,60,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#291313] via-[#1c1214] to-panel border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-critical/20 border border-critical/50 flex items-center justify-center animate-pulse">
              <AlertOctagon className="w-5 h-5 text-critical" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Emergency Citizen SOS Beacon
              </h2>
              <p className="text-[11px] text-muted">Direct dispatch to nearest TNDRF / SDRF Rescue Post</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {sosResult ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-400">SOS BEACON DISPATCHED!</h3>
                <p className="text-xs text-muted mt-1">
                  Your distress coordinates have been broadcast to state emergency dispatch.
                </p>
              </div>

              <div className="bg-panel-2 border border-border rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Assigned Shelter / Rescue Unit:</span>
                  <strong className="text-accent">{sosResult.assigned_shelter}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Distance to Rescue Team:</span>
                  <strong className="text-emerald-400">{sosResult.distance_km} km</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Estimated Response Arrival:</span>
                  <strong className="text-amber-400">~{sosResult.eta_minutes} minutes</strong>
                </div>
                <div className="pt-2 border-t border-white/5 text-[11px] text-sky-300">
                  📞 Emergency Helplines: <strong>1077 (District Control) / 112 (National Police &amp; Rescue)</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  setSosResult(null);
                  onClose();
                }}
                className="w-full bg-accent hover:bg-accent/80 text-[#04141f] font-bold py-2.5 rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Karthikeyan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-panel-2 border border-border rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-critical transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Mobile Contact Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9840123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-panel-2 border border-border rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-critical transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">GPS Latitude</label>
                  <input
                    type="text"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-panel-2 border border-border rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-critical transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">GPS Longitude</label>
                  <input
                    type="text"
                    required
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    className="w-full bg-panel-2 border border-border rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-critical transition-colors"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                className="text-[11px] text-accent hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" /> Auto-Detect My Current GPS
              </button>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Emergency Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Flood water entered house, 3 senior citizens stranded..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-panel-2 border border-border rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-critical transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-critical hover:bg-critical/90 text-white font-black py-3 rounded-xl shadow-[0_0_20px_rgba(231,76,60,0.6)] flex items-center justify-center gap-2 uppercase tracking-wider text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <AlertOctagon className="w-4 h-4 animate-spin" />
                <span>{isSubmitting ? 'Transmitting Distress Beacon...' : '🚨 Trigger Instant SOS Rescue'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function SafeRouteModal({ isOpen, onClose, onPlotRoute }) {
  const [lat, setLat] = useState('11.4100');
  const [lon, setLon] = useState('76.6950');
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);

  if (!isOpen) return null;

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/citizen/safe-route?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setRouteData(data);
    } catch (err) {
      console.error('Route calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlot = () => {
    if (routeData && onPlotRoute) {
      onPlotRoute(routeData.waypoints, routeData.destination_shelter);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-panel border border-accent/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0f1d2e] to-panel border-b border-border">
          <div className="flex items-center gap-2.5">
            <Navigation className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-base font-black text-white">AI Safe Evacuation Navigator</h2>
              <p className="text-[11px] text-muted">High-elevation road routing avoiding flooded rivers &amp; bridges</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Your Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-panel-2 border border-border rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Your Longitude</label>
              <input
                type="text"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full bg-panel-2 border border-border rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/80 text-[#04141f] font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
          >
            {loading ? 'Analyzing High-Elevation Roads...' : 'Calculate Safest Evacuation Route'}
          </button>

          {routeData && (
            <div className="bg-panel-2 border border-border rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-muted">Nearest Safe Haven:</span>
                <strong className="text-white text-sm">📍 {routeData.destination_shelter}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                <div>
                  <span className="text-muted">Distance: </span>
                  <strong className="text-emerald-400">{routeData.distance_km} km</strong>
                </div>
                <div>
                  <span className="text-muted">Est. Travel Time: </span>
                  <strong className="text-amber-400">{routeData.estimated_arrival_minutes} mins</strong>
                </div>
                <div>
                  <span className="text-muted">Beds Free: </span>
                  <strong className="text-sky-400">{routeData.available_capacity}</strong>
                </div>
                <div>
                  <span className="text-muted">Elevation Safety: </span>
                  <strong className="text-emerald-400">{routeData.elevation_safety_score}%</strong>
                </div>
              </div>
              <p className="text-[11px] text-sky-300 italic pt-1 border-t border-white/5">
                🛡️ {routeData.route_advisory}
              </p>

              <button
                onClick={handlePlot}
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-[#04141f] font-bold py-2 rounded-lg transition-all"
              >
                🗺️ Draw Safe Polyline on Map
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HazardReportModal({ isOpen, onClose, onReportSuccess }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('WATERLOGGING');
  const [lat, setLat] = useState('11.4150');
  const [lon, setLon] = useState('76.6970');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/citizen/report-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_name: name || 'Citizen Reporter',
          hazard_type: type,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          description: desc,
        }),
      });
      const data = await res.json();
      if (onReportSuccess) onReportSuccess(data.incident);
      onClose();
    } catch (err) {
      console.error('Incident report error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-panel border border-amber-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#261b0f] to-panel border-b border-border">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-black text-white">Report Local Hazard Incident</h2>
              <p className="text-[11px] text-muted">Crowdsource road blocks, collapsed trees, and live electric wires</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Your Name</label>
            <input
              type="text"
              required
              placeholder="e.g. M. Rajesh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-panel-2 border border-border rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Hazard Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-panel-2 border border-border rounded-xl px-3 py-2 text-xs text-white outline-none"
            >
              <option value="WATERLOGGING">🌊 Road Waterlogging &gt; 2ft</option>
              <option value="FALLEN_TREE">🌳 Fallen Tree Blocking Highway</option>
              <option value="LIVE_WIRE_COLLAPSE">⚡ Live Electric Cable Fallen</option>
              <option value="LANDSLIDE_DEBRIS">🪨 Hillside Rockfall / Landslide</option>
              <option value="BRIDGE_SUBMERGED">🌉 Bridge Overflowing / Submerged</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-panel-2 border border-border rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Longitude</label>
              <input
                type="text"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full bg-panel-2 border border-border rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Description</label>
            <textarea
              required
              rows={2}
              placeholder="Explain the location and condition so response vehicles can navigate..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-panel-2 border border-border rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-600 text-[#04141f] font-bold py-2.5 rounded-xl transition-all"
          >
            {submitting ? 'Transmitting Incident...' : 'Submit Incident Report to Map'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function OfficerLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('collector_nilgiris');
  const [password, setPassword] = useState('NilgirisSafe@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Authentication failed');
      }
      const data = await res.json();
      localStorage.setItem('officer_token', data.access_token);
      localStorage.setItem('officer_user', JSON.stringify(data.user));
      if (onLoginSuccess) onLoginSuccess(data.user, data.access_token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-panel border border-accent/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0e1b29] to-panel border-b border-border">
          <div className="flex items-center gap-2.5">
            <LogIn className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-base font-black text-white">Disaster Officer Authorization</h2>
              <p className="text-[11px] text-muted">Role-Based Access: District Collector &amp; TNDRF Command</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="bg-critical/15 border border-critical/40 text-critical text-xs p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Official Username</label>
            <div className="flex items-center bg-panel-2 border border-border rounded-xl px-3 py-2 gap-2">
              <User className="w-4 h-4 text-muted" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Security Passkey</label>
            <div className="flex items-center bg-panel-2 border border-border rounded-xl px-3 py-2 gap-2">
              <Key className="w-4 h-4 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white w-full"
              />
            </div>
          </div>

          {/* Quick Demo Pre-seed buttons */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10.5px] text-muted font-medium">Quick Credentials for Demo:</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => quickFill('collector_nilgiris', 'NilgirisSafe@2026')}
                className="text-[10px] bg-panel-2 border border-border hover:border-accent text-accent px-2 py-1 rounded"
              >
                🏛️ Collector (Nilgiris)
              </button>
              <button
                type="button"
                onClick={() => quickFill('tndrf_command', 'TndrfRescue@2026')}
                className="text-[10px] bg-panel-2 border border-border hover:border-accent text-emerald-400 px-2 py-1 rounded"
              >
                🎖️ TNDRF State Commander
              </button>
              <button
                type="button"
                onClick={() => quickFill('admin', 'EcoShieldAdmin@2026')}
                className="text-[10px] bg-panel-2 border border-border hover:border-accent text-purple-400 px-2 py-1 rounded"
              >
                🛡️ Chief Admin
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/80 text-[#04141f] font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
          >
            {loading ? 'Authenticating cryptographic token...' : 'Sign In with Secure Access Token'}
          </button>
        </form>
      </div>
    </div>
  );
}
