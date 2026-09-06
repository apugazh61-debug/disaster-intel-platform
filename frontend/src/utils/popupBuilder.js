export function getRiskColor(cat) {
  switch (cat) {
    case 'CRITICAL': return '#e74c3c';
    case 'HIGH': return '#e67e22';
    case 'MODERATE': return '#f1c40f';
    case 'LOW': return '#2ecc71';
    default: return '#3ea6ff';
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
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; border-bottom:1px solid #223041; padding-bottom:6px;">
        <div>
          <div style="font-size:14px; font-weight:700; color:#ffffff; display:flex; align-items:center; gap:4px;">
            <span>📍</span> ${zone.name}
          </div>
          <div style="font-size:11px; color:#8fa3b8; margin-top:2px;">
            👥 Population: <strong>${zone.population.toLocaleString()}</strong>
          </div>
        </div>
        <span style="font-size:10px; font-weight:800; padding:3px 8px; border-radius:20px; color:${cat === 'CRITICAL' ? '#ffffff' : '#04141f'}; background-color:${color}; box-shadow:0 0 10px ${color}88;">
          ${cat} ${score}
        </span>
      </div>

      <div style="margin-bottom:8px;">
        <div style="font-size:10.5px; color:#8fa3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.4px;">
          Active Hazard Diagnosis:
        </div>
        <div style="font-size:12px; font-weight:700; color:${color}; margin-top:2px;">
          ${cat === 'CRITICAL' || cat === 'HIGH' ? '⚠️ ' : '✅ '} ${disaster} RISK: ${cat} (${score}/100)
        </div>
        ${factors.length > 0 ? `
          <div style="font-size:11px; color:#cfdbe8; margin-top:4px; line-height:1.4; background:#0e151e; padding:6px 8px; border-radius:6px; border:1px solid #223041;">
            <strong style="color:#3ea6ff;">Contributing Factors:</strong><br>
            ${factors.map(f => `• ${f}`).join('<br>')}
          </div>
        ` : `<div style="font-size:11px; color:#8fa3b8; margin-top:3px;">No critical thresholds breached. Atmospheric parameters nominal.</div>`}
      </div>

      ${w ? `
        <div style="display:flex; gap:5px; flex-wrap:wrap; margin:8px 0; font-size:11px; background:#0d1622; padding:6px 8px; border-radius:6px; border:1px solid #223041;">
          <div style="color:#94a7bc;">🌡️ <strong style="color:#fff;">${w.temperature_c}°C</strong></div>
          <div style="color:#94a7bc;">🌧️ <strong style="color:#fff;">${w.rainfall_mm} mm</strong></div>
          <div style="color:#94a7bc;">💨 <strong style="color:#fff;">${w.wind_speed_kmh} km/h</strong></div>
          <div style="color:#94a7bc;">💧 <strong style="color:#fff;">${w.humidity_pct}% hum</strong></div>
          <div style="color:#94a7bc;">🌱 Soil: <strong style="color:#fff;">${w.soil_saturation}%</strong></div>
          <div style="color:#94a7bc;">🌊 River: <strong style="color:#fff;">${w.water_level_m}m</strong></div>
        </div>
        <div style="font-size:10.5px; color:#2ecc71; margin-bottom:8px; font-weight:600; display:flex; align-items:center; gap:4px;">
          <span>🛰️</span> ${w.source || 'Open-Meteo Live Satellite'}
        </div>
      ` : ''}

      <button
        onclick="window.triggerZoneSim && window.triggerZoneSim('${zone.id}')"
        style="width:100%; background:#3ea6ff; color:#04141f; font-weight:700; padding:6px 12px; border-radius:8px; border:none; cursor:pointer; font-size:11px; transition:opacity 0.2s;"
        onmouseover="this.style.opacity='0.85'"
        onmouseout="this.style.opacity='1'"
      >
        ⚡ Trigger Crisis Spike
      </button>
    </div>
  `;
}
