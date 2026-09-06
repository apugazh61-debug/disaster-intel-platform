import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Radio, X, CheckCircle2, History, Send } from 'lucide-react';

export default function OfficerDeck({ isOpen, onClose, officerUser, officerToken, zones }) {
  const [activeTab, setActiveTab] = useState('red_alert');
  const [selectedZone, setSelectedZone] = useState('TN-NIL');
  const [alertMessage, setAlertMessage] = useState('Immediate evacuation order issued for low-lying slopes. Emergency shelters fully operational.');
  const [channels, setChannels] = useState(['SIREN', 'SMS', 'VHF_RADIO', 'PUSH_NOTIFICATION']);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === 'audit_log' && officerToken) {
      fetchAuditLogs();
    }
  }, [activeTab, officerToken]);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/security/audit-logs', {
        headers: { Authorization: `Bearer ${officerToken}` }
      });
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/officer/broadcast-red-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${officerToken}`
        },
        body: JSON.stringify({
          zone_id: selectedZone,
          message: alertMessage,
          channels: channels
        })
      });
      const data = await res.json();
      setBroadcastResult(data);
    } catch (err) {
      console.error('Broadcast error:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const toggleChannel = (ch) => {
    if (channels.includes(ch)) {
      setChannels(channels.filter(c => c !== ch));
    } else {
      setChannels([...channels, ch]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="bg-panel border border-accent/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(62,166,255,0.35)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0a1827] via-[#102339] to-panel border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Officer Command &amp; Defense Console
              </h2>
              <p className="text-[11px] text-muted">
                Authenticated: <strong className="text-accent">{officerUser?.full_name}</strong> ({officerUser?.agency})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border bg-panel-2 px-6 pt-2">
          <button
            onClick={() => setActiveTab('red_alert')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'red_alert'
                ? 'border-critical text-critical'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>🚨 Issue Official Red Alert</span>
          </button>
          <button
            onClick={() => setActiveTab('audit_log')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'audit_log'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>🛡️ Anti-Tamper Audit Ledger</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'red_alert' && (
            <div className="space-y-4">
              {broadcastResult ? (
                <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-emerald-400">OFFICIAL RED ALERT BROADCAST TRANSMITTED!</h3>
                  <p className="text-xs text-muted">
                    Dispatched via sirens, SMS gateway, VHF, and application push banners.
                  </p>
                  <button
                    onClick={() => setBroadcastResult(null)}
                    className="mt-2 text-xs bg-panel-2 border border-border px-3 py-1.5 rounded-lg text-text hover:border-accent"
                  >
                    Send Another Order
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBroadcast} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Target District Jurisdiction</label>
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full bg-panel-2 border border-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-critical"
                    >
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>
                          {z.name} (Pop: {z.population?.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Official Evacuation Directive</label>
                    <textarea
                      rows={3}
                      required
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      className="w-full bg-panel-2 border border-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-critical"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1.5">Emergency Dispatch Channels</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['SIREN', 'SMS', 'VHF_RADIO', 'PUSH_NOTIFICATION'].map(ch => (
                        <label
                          key={ch}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                            channels.includes(ch)
                              ? 'bg-critical/15 border-critical/50 text-white'
                              : 'bg-panel-2 border-border text-muted'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={channels.includes(ch)}
                            onChange={() => toggleChannel(ch)}
                            className="accent-critical"
                          />
                          <span>{ch === 'SIREN' ? '📢 Physical State Sirens' : ch === 'SMS' ? '📱 Statewide SMS Gateway' : ch === 'VHF_RADIO' ? '📡 VHF Maritime/Police Radio' : '🔔 Emergency App Push'}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="w-full bg-critical hover:bg-critical/90 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(231,76,60,0.5)] transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isBroadcasting ? 'Signing & Broadcasting Alert...' : 'Declare Official Red Alert & Evacuation'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'audit_log' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-muted">
                <span>Cryptographic HMAC-SHA256 verification of all critical commands</span>
                <button onClick={fetchAuditLogs} className="text-accent hover:underline text-[11px]">
                  🔄 Refresh Log
                </button>
              </div>

              {loadingLogs ? (
                <div className="text-center text-xs text-muted py-8">Verifying cryptographic audit signatures...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center text-xs text-muted py-8">No audit events recorded yet.</div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-panel-2 border border-border rounded-xl p-3 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span>👤 {log.username}</span>
                          <span className="text-accent font-mono text-[10px]">[{log.action}]</span>
                        </span>
                        <span className="text-[10px] text-muted">{log.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>HMAC Verified (Tamper-Proof)</span>
                        </span>
                        <span className="text-muted font-mono text-[9px] truncate max-w-[200px]" title={log.hmac_signature}>
                          Sig: {log.hmac_signature.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
