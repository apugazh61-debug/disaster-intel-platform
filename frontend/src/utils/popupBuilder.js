export function getRiskColor(cat) {
  switch (cat) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH': return '#f97316';
    case 'MODERATE': return '#f59e0b';
    case 'LOW': return '#10b981';
    default: return '#0284c7';
  }
}

export function buildPopupHtml(zone, topRisk) {
  const cat = topRisk ? topRisk.risk_category : "LOW";
  const score = topRisk ? topRisk.risk_score : 10.0;
  const disaster = topRisk ? topRisk.disaster_type : "MONITORING";
  const factors = topRisk && topRisk.contributing_factors ? topRisk.contributing_factors : [];
  const w = topRisk ? topRisk.weather_info : null;
  const color = getRiskColor(cat);

  return `
    <div style="padding: 2px 0; font-family: 'Segoe UI', system-ui, sans-serif;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
        <div>
          <div style="font-size:14px; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:4px;">
            <span>📍</span> ${zone.name}
          </div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">
            👥 Population: <strong>${zone.population.toLocaleString()}</strong>
          </div>
        </div>
        <span style="font-size:10.5px; font-weight:800; padding:3px 8px; border-radius:20px; color:#ffffff; background-color:${color}; box-shadow:0 2px 6px ${color}55;">
          ${cat} ${score}
        </span>
      </div>

      <div style="margin-bottom:8px;">
        <div style="font-size:10.5px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.4px;">
          Active Hazard Diagnosis:
        </div>
        <div style="font-size:12px; font-weight:700; color:${color}; margin-top:2px;">
          ${cat === 'CRITICAL' || cat === 'HIGH' ? '⚠️ ' : '✅ '} ${disaster} RISK: ${cat} (${score}/100)
        </div>
        ${factors.length > 0 ? `
          <div style="font-size:11px; color:#334155; margin-top:4px; line-height:1.4; background:#f8fafc; padding:6px 8px; border-radius:6px; border:1px solid #e2e8f0;">
            <strong style="color:#0284c7;">Contributing Factors:</strong><br>
            ${factors.map(f => `• ${f}`).join('<br>')}
          </div>
        ` : `<div style="font-size:11px; color:#64748b; margin-top:3px;">No critical thresholds breached. Atmospheric parameters nominal.</div>`}
      </div>

      ${w ? `
        <div style="display:flex; gap:5px; flex-wrap:wrap; margin:8px 0; font-size:11px; background:#f8fafc; padding:6px 8px; border-radius:8px; border:1px solid #e2e8f0;">
          <div style="color:#64748b;">🌡️ <strong style="color:#0f172a;">${w.temperature_c}°C</strong></div>
          <div style="color:#64748b;">🌧️ <strong style="color:#0f172a;">${w.rainfall_mm} mm</strong></div>
          <div style="color:#64748b;">💨 <strong style="color:#0f172a;">${w.wind_speed_kmh} km/h</strong></div>
          <div style="color:#64748b;">💧 <strong style="color:#0f172a;">${w.humidity_pct}% hum</strong></div>
          <div style="color:#64748b;">🌱 Soil: <strong style="color:#0f172a;">${w.soil_saturation}%</strong></div>
          <div style="color:#64748b;">🌊 River: <strong style="color:#0f172a;">${w.water_level_m}m</strong></div>
        </div>
        <div style="font-size:10.5px; color:#059669; margin-bottom:8px; font-weight:600; display:flex; align-items:center; gap:4px;">
          <span>🛰️</span> ${w.source || 'Open-Meteo Live Satellite'}
        </div>
      ` : ''}

      <div style="display:flex; gap:6px; margin-top:6px;">
        <button
          onclick="window.triggerZoneSim && window.triggerZoneSim('${zone.id}')"
          style="flex:1; background:#0284c7; color:#ffffff; font-weight:700; padding:7px 8px; border-radius:8px; border:none; cursor:pointer; font-size:11px; transition:background 0.2s;"
          onmouseover="this.style.background='#0369a1'"
          onmouseout="this.style.background='#0284c7'"
        >
          ⚡ Crisis Spike
        </button>
        <button
          onclick="window.openTelegramForZone && window.openTelegramForZone('${zone.id}')"
          style="flex:1; background:#229ED9; color:#ffffff; font-weight:700; padding:7px 8px; border-radius:8px; border:none; cursor:pointer; font-size:11px; transition:background 0.2s;"
          onmouseover="this.style.background='#1b8bc2'"
          onmouseout="this.style.background='#229ED9'"
        >
          ✈️ Telegram Alert
        </button>
      </div>
    </div>
  `;
}
