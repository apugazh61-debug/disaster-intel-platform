import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import OverviewStats from './components/OverviewStats';
import DistrictList from './components/DistrictList';
import AlertFeed from './components/AlertFeed';
import {
  SosModal,
  SafeRouteModal,
  HazardReportModal,
  OfficerLoginModal
} from './components/CitizenModals';
import OfficerDeck from './components/OfficerDeck';

export default function App() {
  const [zones, setZones] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [summary, setSummary] = useState(null);
  const [systemMode, setSystemMode] = useState('LIVE_OPEN_METEO');
  const [zoneStates, setZoneStates] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [flyToTrigger, setFlyToTrigger] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Security & Officer State
  const [officerUser, setOfficerUser] = useState(null);
  const [officerToken, setOfficerToken] = useState(null);
  const [isOfficerLoginOpen, setIsOfficerLoginOpen] = useState(false);
  const [isOfficerDeckOpen, setIsOfficerDeckOpen] = useState(false);

  // Citizen Life-Saving State
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isSafeRouteOpen, setIsSafeRouteOpen] = useState(false);
  const [isHazardOpen, setIsHazardOpen] = useState(false);
  const [safeRoute, setSafeRoute] = useState(null);
  const [hazardIncidents, setHazardIncidents] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initialize stored officer session
  useEffect(() => {
    const savedToken = localStorage.getItem('officer_token');
    const savedUser = localStorage.getItem('officer_user');
    if (savedToken && savedUser) {
      try {
        setOfficerToken(savedToken);
        setOfficerUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('officer_token');
        localStorage.removeItem('officer_user');
      }
    }
  }, []);

  // Voice speech synthesizer
  const announceVoiceWarning = useCallback((message, zoneName) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Tamil audio emergency announcement
      const tamilAlert = `எச்சரிக்கை! ${zoneName || 'தமிழ்நாடு'} பகுதியில் அவசர எச்சரிக்கை விடுக்கப்பட்டுள்ளது. உடனடியாக பாதுகாப்பான இடத்திற்கு செல்லவும்.`;
      const utterance = new SpeechSynthesisUtterance(tamilAlert);
      const voices = window.speechSynthesis.getVoices();
      const taVoice = voices.find(v => v.lang && (v.lang.toLowerCase().includes('ta') || v.lang.toLowerCase().includes('tam')));
      if (taVoice) utterance.voice = taVoice;
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis unavailable:', err);
    }
  }, [voiceEnabled]);

  // Fetch initial data
  const loadInitialData = async () => {
    try {
      const [zonesRes, sheltersRes, summaryRes, modeRes, incidentsRes] = await Promise.all([
        fetch('/api/zones'),
        fetch('/api/shelters'),
        fetch('/api/dashboard/summary'),
        fetch('/api/system/mode'),
        fetch('/api/citizen/incidents'),
      ]);

      const zonesData = await zonesRes.json();
      const sheltersData = await sheltersRes.json();
      const summaryData = await summaryRes.json();
      const modeData = await modeRes.json();
      const incidentsData = await incidentsRes.json();

      setZones(zonesData);
      setShelters(sheltersData);
      setSummary(summaryData);
      setHazardIncidents(incidentsData || []);

      if (modeData && modeData.mode) {
        setSystemMode(modeData.mode);
      }

      const initialStates = {};
      zonesData.forEach((z) => {
        initialStates[z.id] = {
          zone_id: z.id,
          zone_name: z.name,
          disaster_type: 'MONITORING',
          risk_score: 15.0,
          risk_category: 'LOW',
          confidence: 0.7,
          contributing_factors: [],
        };
      });
      setZoneStates(initialStates);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  // WebSocket Connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onclose = () => {
      setWsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'prediction_update') {
          const { zone, top_risk, weather_info } = msg.data;
          setZoneStates((prev) => {
            const existingWeather = prev[zone.id]?.weather_info;
            return {
              ...prev,
              [zone.id]: {
                zone_id: zone.id,
                zone_name: zone.name,
                weather_info: weather_info || existingWeather,
                ...top_risk,
              },
            };
          });
          loadSummary();
        } else if (msg.type === 'new_alert') {
          setAlerts((prev) => [msg.data, ...prev].slice(0, 20));
          loadSummary();
          if (msg.data.severity === 'CRITICAL') {
            announceVoiceWarning(msg.data.message, msg.data.zone_id);
          }
        } else if (msg.type === 'citizen_sos_broadcast') {
          const sos = msg.data;
          const sosAlert = {
            severity: 'CRITICAL',
            disaster_type: '🚨 CITIZEN SOS RESCUE',
            message: `SOS Distress Beacon from ${sos.citizen_name} (Phone: ${sos.phone}) near coordinates [${sos.latitude}, ${sos.longitude}]. Team dispatched from ${sos.assigned_shelter} (ETA: ~${sos.eta_minutes} mins). Note: ${sos.emergency_note || 'Immediate rescue'}`,
            channels: ['TNDRF_DISPATCH', 'SDRF_POST', 'SMS_ALERT'],
            population_affected: 1,
            timestamp: sos.timestamp,
          };
          setAlerts((prev) => [sosAlert, ...prev].slice(0, 20));
          loadSummary();
          announceVoiceWarning(`சிட்டிசன் அவசர எஸ் ஓ எஸ்! மீட்புக் குழு அனுப்பப்பட்டுள்ளது.`, 'SOS');
        } else if (msg.type === 'new_hazard_incident') {
          setHazardIncidents((prev) => [msg.data, ...prev]);
        } else if (msg.type === 'system_mode_update') {
          if (msg.mode) setSystemMode(msg.mode);
          if (msg.weather) {
            setZoneStates((prev) => {
              const updated = { ...prev };
              for (const [zid, w] of Object.entries(msg.weather)) {
                if (updated[zid]) {
                  updated[zid] = { ...updated[zid], weather_info: w };
                }
              }
              return updated;
            });
          }
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
  }, [announceVoiceWarning]);

  useEffect(() => {
    loadInitialData();
    connectWebSocket();

    const summaryInterval = setInterval(loadSummary, 15000);

    return () => {
      clearInterval(summaryInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  // District Selection
  const handleSelectDistrict = useCallback((zoneId) => {
    setSelectedZoneId(zoneId);
    setFlyToTrigger({ type: 'ZONE', zoneId, timestamp: Date.now() });
  }, []);

  // Reset Map View
  const handleResetView = useCallback(() => {
    setSelectedZoneId(null);
    setSafeRoute(null);
    setFlyToTrigger({ type: 'RESET', timestamp: Date.now() });
  }, []);

  // System Mode Toggle
  const handleToggleMode = async () => {
    const newMode = systemMode === 'LIVE_OPEN_METEO' ? 'SIMULATION_DRILL' : 'LIVE_OPEN_METEO';
    try {
      const res = await fetch(`/api/system/mode/${newMode}`, { method: 'POST' });
      const data = await res.json();
      if (data && data.mode) {
        setSystemMode(data.mode);
      }
    } catch (err) {
      console.error('Failed to toggle system mode:', err);
    }
  };

  // Satellite Telemetry Sync
  const handleSyncSatellite = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/weather/sync', { method: 'POST' });
    } catch (err) {
      console.error('Failed to sync satellite:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 900);
    }
  };

  // Disaster Simulation Trigger
  const handleSimulate = useCallback(async (zoneId) => {
    try {
      const res = await fetch(`/api/simulate/disaster/${zoneId}`, { method: 'POST' });
      const data = await res.json();
      if (data && data.zone) {
        handleSelectDistrict(data.zone.id);
      }
    } catch (err) {
      console.error('Simulation trigger failed:', err);
    }
  }, [handleSelectDistrict]);

  // Expose global simulate hook for popup
  useEffect(() => {
    window.triggerZoneSim = handleSimulate;
    return () => {
      delete window.triggerZoneSim;
    };
  }, [handleSimulate]);

  // Officer Login & Logout
  const handleOfficerLoginSuccess = (user, token) => {
    setOfficerUser(user);
    setOfficerToken(token);
    setIsOfficerDeckOpen(true);
  };

  const handleOfficerLogout = () => {
    localStorage.removeItem('officer_token');
    localStorage.removeItem('officer_user');
    setOfficerUser(null);
    setOfficerToken(null);
    setIsOfficerDeckOpen(false);
  };

  // Safe Route Plotting
  const handlePlotRoute = (waypoints, shelterName) => {
    setSafeRoute({ waypoints, shelterName });
  };

  const activeZone = zones.find((z) => z.id === selectedZoneId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg text-text">
      {/* Header with Quick Actions */}
      <Header
        systemMode={systemMode}
        onToggleMode={handleToggleMode}
        onSyncSatellite={handleSyncSatellite}
        isSyncing={isSyncing}
        onResetView={handleResetView}
        zones={zones}
        zoneStates={zoneStates}
        onSelectDistrict={handleSelectDistrict}
        wsConnected={wsConnected}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenSafeRoute={() => setIsSafeRouteOpen(true)}
        onOpenHazard={() => setIsHazardOpen(true)}
        onOpenOfficerLogin={() => setIsOfficerLoginOpen(true)}
        onOpenOfficerDeck={() => setIsOfficerDeckOpen(true)}
        officerUser={officerUser}
        onLogoutOfficer={handleOfficerLogout}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
      />

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-3.5 p-3.5 overflow-hidden min-h-0">
        {/* Left Column: Map + Overview Stats */}
        <div className="flex flex-col gap-3.5 min-h-0">
          <MapView
            zones={zones}
            shelters={shelters}
            zoneStates={zoneStates}
            selectedZoneId={selectedZoneId}
            onSelectDistrict={handleSelectDistrict}
            activeDistrictName={activeZone?.name}
            flyToTrigger={flyToTrigger}
            safeRoute={safeRoute}
            hazardIncidents={hazardIncidents}
          />
          <OverviewStats summary={summary} />
        </div>

        {/* Right Column: Districts List + Alert Feed */}
        <div className="flex flex-col gap-3.5 min-h-0">
          <DistrictList
            zones={zones}
            zoneStates={zoneStates}
            selectedZoneId={selectedZoneId}
            onSelectDistrict={handleSelectDistrict}
            onSimulate={handleSimulate}
          />
          <AlertFeed alerts={alerts} />
        </div>
      </div>

      {/* Modals */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onSosSuccess={() => loadSummary()}
      />

      <SafeRouteModal
        isOpen={isSafeRouteOpen}
        onClose={() => setIsSafeRouteOpen(false)}
        onPlotRoute={handlePlotRoute}
      />

      <HazardReportModal
        isOpen={isHazardOpen}
        onClose={() => setIsHazardOpen(false)}
        onReportSuccess={(inc) => setHazardIncidents((prev) => [inc, ...prev])}
      />

      <OfficerLoginModal
        isOpen={isOfficerLoginOpen}
        onClose={() => setIsOfficerLoginOpen(false)}
        onLoginSuccess={handleOfficerLoginSuccess}
      />

      <OfficerDeck
        isOpen={isOfficerDeckOpen}
        onClose={() => setIsOfficerDeckOpen(false)}
        officerUser={officerUser}
        officerToken={officerToken}
        zones={zones}
      />
    </div>
  );
}
