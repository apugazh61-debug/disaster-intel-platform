import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getRiskColor, buildPopupHtml } from '../utils/popupBuilder';

const TN_CENTER = [11.0, 78.65];
const TN_DEFAULT_ZOOM = 7;

export default function MapView({
  zones,
  shelters,
  zoneStates,
  selectedZoneId,
  onSelectDistrict,
  activeDistrictName,
  flyToTrigger
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const zoneMarkersRef = useRef({});
  const shelterMarkersRef = useRef([]);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      center: TN_CENTER,
      zoom: TN_DEFAULT_ZOOM,
    });

    // 1. Esri World Imagery (Satellite)
    const satellite = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri World Imagery',
        maxZoom: 18,
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 18,
      }),
    ]);

    // 2. Dark Command Canvas
    const darkCanvas = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri Dark Canvas',
        maxZoom: 16,
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 16,
      }),
    ]);

    // 3. Street Map
    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });

    // Default to colorful satellite view
    satellite.addTo(map);

    const baseLayers = {
      "🛰️ Satellite View": satellite,
      "🌑 Dark Command": darkCanvas,
      "🗺️ Street Map": streets,
    };

    L.control.layers(baseLayers, null, { position: 'topright', collapsed: false }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Shelters
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || shelters.length === 0) return;

    // Clear previous shelter markers
    shelterMarkersRef.current.forEach(m => m.remove());
    shelterMarkersRef.current = [];

    shelters.forEach(s => {
      const typeIcon = s.type === 'MEDICAL' ? '🏥' : s.type === 'RESCUE_UNIT' ? '🚑' : '🏠';
      const icon = L.divIcon({
        className: 'shelter-custom-div',
        html: `
          <div style="background:#161e29;border:1px solid #3ea6ff;color:#3ea6ff;font-size:10px;font-weight:600;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.6);display:flex;align-items:center;gap:3px;">
            <span>${typeIcon}</span>
            <span>${s.name}</span>
          </div>
        `,
      });

      const marker = L.marker([s.latitude, s.longitude], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="padding:4px; font-family:'Segoe UI',sans-serif;">
          <div style="font-weight:700; font-size:13px; color:#fff; margin-bottom:4px;">${typeIcon} ${s.name}</div>
          <div style="font-size:11.5px; color:#8fa3b8; line-height:1.4;">
            Type: <strong style="color:#e7edf3;">${s.type}</strong><br>
            Capacity: <strong style="color:#2ecc71;">${s.capacity} beds</strong><br>
            Operational Status: <strong style="color:#3ea6ff;">${s.status}</strong>
          </div>
        </div>
      `);
      shelterMarkersRef.current.push(marker);
    });
  }, [shelters]);

  // Render / Update Zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || zones.length === 0) return;

    zones.forEach(z => {
      const state = zoneStates[z.id] || {
        risk_category: 'LOW',
        risk_score: 15.0,
        disaster_type: 'MONITORING',
        confidence: 0.7,
        contributing_factors: [],
      };

      const color = getRiskColor(state.risk_category);

      let marker = zoneMarkersRef.current[z.id];
      if (!marker) {
        marker = L.circle([z.latitude, z.longitude], {
          radius: 9500, // 9.5km radius for clear statewide visibility
          color: color,
          fillColor: color,
          fillOpacity: state.risk_category === 'CRITICAL' ? 0.6 : 0.35,
          weight: 2,
        }).addTo(map);

        marker.on('click', () => {
          onSelectDistrict(z.id);
        });

        zoneMarkersRef.current[z.id] = marker;
      } else {
        marker.setStyle({
          color: color,
          fillColor: color,
          fillOpacity: state.risk_category === 'CRITICAL' ? 0.6 : 0.35,
        });
      }

      // Update popup content with latest telemetry and state
      marker.bindPopup(buildPopupHtml(z, state));
    });
  }, [zones, zoneStates, onSelectDistrict]);

  // Handle FlyTo requests
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToTrigger) return;

    if (flyToTrigger.type === 'RESET') {
      map.flyTo(TN_CENTER, TN_DEFAULT_ZOOM, { duration: 1.2 });
      map.closePopup();
    } else if (flyToTrigger.type === 'ZONE' && flyToTrigger.zoneId) {
      const z = zones.find(item => item.id === flyToTrigger.zoneId);
      const marker = zoneMarkersRef.current[flyToTrigger.zoneId];
      if (z && marker) {
        map.flyTo([z.latitude, z.longitude], 11, { duration: 1.4 });
        setTimeout(() => {
          marker.openPopup();
        }, 1450);
      }
    }
  }, [flyToTrigger, zones]);

  return (
    <div className="flex-1 flex flex-col bg-panel border border-border rounded-xl p-3.5 min-h-[360px] relative overflow-hidden shadow-lg">
      <div className="flex justify-between items-center mb-2 px-1">
        <h2 className="text-xs uppercase tracking-wider font-bold text-muted flex items-center gap-2">
          <span>Live Risk Map — Tamil Nadu Statewide Monitor</span>
        </h2>
        <span className="text-[11px] font-semibold text-accent bg-accent/10 border border-accent/30 px-2.5 py-0.5 rounded-full">
          {activeDistrictName ? `Focused: ${activeDistrictName}` : 'Statewide Overview'}
        </span>
      </div>
      <div ref={mapContainerRef} className="flex-1 w-full rounded-lg z-0 min-h-[300px]" />
    </div>
  );
}
