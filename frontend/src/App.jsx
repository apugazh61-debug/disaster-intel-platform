import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import OverviewStats from './components/OverviewStats';
import DistrictList from './components/DistrictList';
import AlertFeed from './components/AlertFeed';

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

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Fetch initial data
  const loadInitialData = async () => {
    try {
      const [zonesRes, sheltersRes, summaryRes, modeRes] = await Promise.all([
        fetch('/api/zones'),
        fetch('/api/shelters'),
        fetch('/api/dashboard/summary'),
        fetch('/api/system/mode'),
      ]);

      const zonesData = await zonesRes.json();
      const sheltersData = await sheltersRes.json();
      const summaryData = await summaryRes.json();
      const modeData = await modeRes.json();

      setZones(zonesData);
      setShelters(sheltersData);
      setSummary(summaryData);
      if (modeData && modeData.mode) {
        setSystemMode(modeData.mode);
      }

      // Initialize zone states
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
  }, []);

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

  // Handle District Selection
  const handleSelectDistrict = useCallback((zoneId) => {
    setSelectedZoneId(zoneId);
    setFlyToTrigger({ type: 'ZONE', zoneId, timestamp: Date.now() });
  }, []);

  // Handle Reset View
  const handleResetView = useCallback(() => {
    setSelectedZoneId(null);
    setFlyToTrigger({ type: 'RESET', timestamp: Date.now() });
  }, []);

  // Handle Mode Toggle
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

  // Handle Satellite Telemetry Sync
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

  // Handle Disaster Simulation Trigger
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

  // Expose simulation to global window for Leaflet Popup button
  useEffect(() => {
    window.triggerZoneSim = handleSimulate;
    return () => {
      delete window.triggerZoneSim;
    };
  }, [handleSimulate]);

  const activeZone = zones.find((z) => z.id === selectedZoneId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg text-text">
      {/* Header */}
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
    </div>
  );
}
