import React, { useState, useEffect } from 'react';
import {
  Send,
  X,
  Radio,
  CheckCircle2,
  Users,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  RefreshCw,
  PhoneCall
} from 'lucide-react';

export default function TelegramModal({ isOpen, onClose, zones = [], defaultZoneId = 'TN-NIL' }) {
  const [selectedZone, setSelectedZone] = useState(defaultZoneId);
  const [customNote, setCustomNote] = useState('Immediate precautionary evacuation advised for low-lying and slope settlements.');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [previewTab, setPreviewTab] = useState('bilingual'); // bilingual, tamil, english

  useEffect(() => {
    if (defaultZoneId) setSelectedZone(defaultZoneId);
  }, [defaultZoneId]);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.warn('Failed to fetch telegram status:', err);
    }
  };

  const handleBroadcast = async (isTest = false) => {
    setIsSending(true);
    setBroadcastResult(null);
    try {
      const endpoint = isTest ? '/api/telegram/test-alert' : '/api/telegram/broadcast';
      const body = isTest ? {} : { zone_id: selectedZone, custom_note: customNote };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setBroadcastResult(data);
      fetchStatus();
    } catch (err) {
      console.error('Broadcast failed:', err);
      setBroadcastResult({ status: 'failed', error: String(err) });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const currentZoneObj = zones.find(z => z.id === selectedZone) || { name: 'Nilgiris' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-50 via-white to-blue-50/50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Telegram Emergency Broadcast
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-slate-500">
                அதிவிரைவு அவசர அறிவிப்பு மையம் • Zero SMS/WhatsApp Cost
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Metric Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-center">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Bot Channel</div>
              <div className="text-xs font-bold text-sky-600 truncate mt-0.5 flex items-center justify-center gap-1">
                <span>{status?.channel_configured || '@tndisasteralerts'}</span>
              </div>
            </div>
            <div className="border-x border-slate-200">
              <div className="text-[11px] font-medium text-slate-500">Subscribers Reach</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>{(status?.active_subscribers || 1420).toLocaleString()} Citizen Units</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Transmission Cost</div>
              <div className="text-xs font-bold text-emerald-600 mt-0.5">
                ₹0.00 / Unlimited
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target District / Zone
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm transition-all"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Channel Handle
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://t.me/tndisasteralerts"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none select-all"
                  />
                  <a
                    href="https://t.me/tndisasteralerts"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 rounded-xl transition-colors"
                    title="Open Channel in Telegram"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Custom Directive / கள உத்தரவு
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Type emergency instructions for citizens (Tamil or English)..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm transition-all resize-none"
              />
            </div>
          </div>

          {/* Telegram Preview Box */}
          <div className="rounded-2xl border border-sky-100 bg-[#eff6fc]/70 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-200/60">
              <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                Telegram Live Bulletin Preview (இருமொழி வடிவம்)
              </span>
              <span className="text-[10px] text-sky-700 bg-white/80 px-2 py-0.5 rounded-full font-semibold border border-sky-100">
                Markdown Formatted
              </span>
            </div>

            <div className="font-mono text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap bg-white/90 p-3.5 rounded-xl border border-sky-100/80 shadow-sm max-h-48 overflow-y-auto">
{`🚨 *தமிழ்நாடு அரசு அவசர பேரிடர் எச்சரிக்கை*
🚨 *TAMIL NADU STATE EMERGENCY ADVISORY* 🚨

📍 *மாவட்டம் / District:* ${currentZoneObj.name}
⚡ *எச்சரிக்கை வகை / Hazard:* Extreme Weather Alert
🛡️ *அபாய நிலை / Threat Level:* HIGH RISK
🕒 *வெளியீடு:* ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}

📢 *கள உத்தரவு:* ${customNote}

⚠️ *பாதுகாப்பு அறிவுரைகள் (Safety Protocols):*
  • தாழ்வான பகுதி மக்கள் பாதுகாப்பான இடங்களுக்கு செல்லவும்.
  • அவசியமின்றி வெளியில் செல்ல வேண்டாம்.

📞 *24x7 தமிழ்நாடு அவசர உதவி எண்கள்:*
  • மாநில அவசர மையம்: 1070 | மாவட்ட ஆட்சியர்: 1077 | அவசரம்: 112`}
            </div>
          </div>

          {/* Broadcast Feedback Alert */}
          {broadcastResult && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
              broadcastResult.status === 'success' || broadcastResult.broadcast_status === 'DISPATCHED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">
                  {broadcastResult.status === 'success' || broadcastResult.broadcast_status === 'DISPATCHED'
                    ? '✅ Emergency Telegram Alert Dispatched Successfully!'
                    : 'Dispatch Status Updated'}
                </div>
                <div className="text-[11px] text-slate-600">
                  Target Zone: <strong>{broadcastResult.zone_id || selectedZone}</strong> •
                  Recipients: <strong>{(broadcastResult.recipients || broadcastResult.recipients_count || 1420).toLocaleString()}</strong> active devices •
                  Cost: <strong>₹0.00</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleBroadcast(true)}
            disabled={isSending}
            className="text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Test Dispatch</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleBroadcast(false)}
              disabled={isSending}
              className="bg-[#229ED9] hover:bg-[#1e8bc2] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send 1-Click Telegram Alert</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
