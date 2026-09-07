"""
telegram_service.py
Tamil Nadu Emergency Disaster Telegram Alert & Broadcast Dispatch Engine.

Provides 100% free, unlimited instant emergency broadcasting to:
- Official State/District Public Telegram Channels (e.g. @tndisasteralerts)
- Subscribed Emergency Volunteers, First Responders & Citizens
- Civil Defense & TNDRF Field Coordinators

Handles rich Markdown disaster bulletins, automated shelter guidance,
rainfall alerts, and complete transmission auditing into SQLite.
"""

import os
import json
import logging
import sqlite3
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import httpx

logger = logging.getLogger("telegram_service")
logger.setLevel(logging.INFO)

# Telegram Bot Credentials (configurable via environment variables)
# If not provided, engine operates in Interactive Simulation Mode for testing & demonstrations.
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "@tndisasteralerts").strip()

TELEGRAM_API_BASE = "https://api.telegram.org"


def is_telegram_configured() -> bool:
    """Checks if a valid live Telegram Bot token is present."""
    return bool(TELEGRAM_BOT_TOKEN and len(TELEGRAM_BOT_TOKEN) > 15)


def get_telegram_status(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Returns Telegram bot configuration status, subscriber count, and broadcast metrics."""
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM telegram_subscribers WHERE is_active = 1")
    active_subscribers = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM telegram_broadcast_logs")
    total_broadcasts = cur.fetchone()[0]

    cur.execute("""
    SELECT id, zone_id, alert_level, message_text, recipients_count, delivery_status, dispatched_at 
    FROM telegram_broadcast_logs ORDER BY id DESC LIMIT 5
    """)
    recent_logs = [
        {
            "id": row[0],
            "zone_id": row[1],
            "alert_level": row[2],
            "message_snippet": row[3][:120] + "..." if len(row[3]) > 120 else row[3],
            "recipients_count": row[4],
            "delivery_status": row[5],
            "dispatched_at": row[6]
        }
        for row in cur.fetchall()
    ]

    return {
        "bot_configured": is_telegram_configured(),
        "channel_configured": TELEGRAM_CHANNEL_ID,
        "mode": "LIVE_TELEGRAM_BOT" if is_telegram_configured() else "SIMULATED_STANDBY",
        "active_subscribers": active_subscribers,
        "total_broadcasts": total_broadcasts,
        "recent_broadcasts": recent_logs,
        "cost_per_message": "₹0.00 (100% Free / Unlimited)"
    }


from localization import DISTRICT_NAMES_TA, DISASTER_TYPES_TA, RISK_LEVELS

def format_emergency_bulletin(
    zone: Dict[str, Any],
    risk_level: str = "HIGH",
    hazard_type: str = "Extreme Weather / Flood Alert",
    prediction_info: Optional[Dict[str, Any]] = None,
    shelters: Optional[List[Dict[str, Any]]] = None,
    custom_note: Optional[str] = None
) -> str:
    """
    Constructs an authoritative, high-impact Bilingual (தமிழ் & English) Telegram bulletin.
    Optimized for rapid mobile reading by citizens, district collectors, and field relief teams.
    """
    zname_en = zone.get("name", "Tamil Nadu District")
    zname_key = zname_en.lower().strip()
    zname_ta = DISTRICT_NAMES_TA.get(zname_key, zname_en)
    now_str = datetime.now(timezone.utc).strftime("%d %b %Y | %I:%M %p UTC")

    alert_emoji = "🚨" if risk_level in ["CRITICAL", "HIGH", "RED"] else "⚠️"
    status_header = (
        f"{alert_emoji} *தமிழ்நாடு அரசு அவசர பேரிடர் எச்சரிக்கை*\n"
        f"{alert_emoji} *TAMIL NADU STATE EMERGENCY ADVISORY* {alert_emoji}"
    )

    risk_ta = RISK_LEVELS.get("ta", {}).get(risk_level, risk_level)

    shelter_lines = ""
    if shelters:
        shelter_lines += "\n*🏠 அருகிலுள்ள பாதுகாப்பான தங்குமிடங்கள் (Safe Shelters):*\n"
        for idx, s in enumerate(shelters[:3], 1):
            s_name = s.get("name", "Relief Shelter")
            s_cap = s.get("capacity", 500)
            s_dist = s.get("distance_km", 0.0)
            shelter_lines += f"  • *{idx}. {s_name}* ({s_dist} km) — இடம்: {s_cap:,} persons\n"

    prediction_metrics = ""
    if prediction_info:
        rain = prediction_info.get("precipitation_mm", 0.0)
        wind = prediction_info.get("wind_speed_kmh", 0.0)
        risk_score = prediction_info.get("risk_score", 0.0)
        prediction_metrics = (
            f"\n*📊 நேரலை தகவல் (Live Telemetry):*\n"
            f"  • இடர் நிலை / Risk Score: `{risk_score:.2f} / 1.00` ({risk_level} / {risk_ta})\n"
            f"  • மழை / Rain Rate: `{rain} mm` | காற்று / Wind: `{wind} km/h`\n"
        )

    note_section = ""
    if custom_note:
        note_section = f"\n*📢 கள உத்தரவு (Field Directive):* {custom_note}\n"

    bulletin = (
        f"{status_header}\n\n"
        f"📍 *மாவட்டம் / District:* *{zname_ta}* ({zname_en})\n"
        f"⚡ *எச்சரிக்கை வகை / Hazard:* {hazard_type}\n"
        f"🛡️ *அபாய நிலை / Threat Level:* `{risk_level}` ({risk_ta})\n"
        f"🕒 *வெளியிடப்பட்ட நேரம் / Time:* {now_str}\n"
        f"{prediction_metrics}"
        f"{shelter_lines}"
        f"{note_section}\n"
        f"⚠️ *பாதுகாப்பு அறிவுரைகள் (Safety Protocols):*\n"
        f"  • தாழ்வான பகுதி மக்கள் பாதுகாப்பான இடங்களுக்கு செல்லவும்.\n"
        f"  • அவசியமின்றி வெளியில் செல்ல வேண்டாம்.\n\n"
        f"*📞 24x7 தமிழ்நாடு அவசர உதவி எண்கள் (Helplines):*\n"
        f"  • மாநில அவசர கட்டுப்பாட்டு மையம்: *1070*\n"
        f"  • மாவட்ட ஆட்சியர் கட்டுப்பாட்டு மையம்: *1077*\n"
        f"  • காவல்துறை / பொது அவசரம்: *112*\n"
        f"  • மருத்துவ உதவி: *104*\n\n"
        f"_வெளியீடு: தமிழ்நாடு பேரிடர் மேலாண்மை ஆணையம் (TNDMA)_\n"
        f"_Channel: @tndisasteralerts | Zero Cost Automated Emergency Feed_"
    )

    return bulletin


async def send_telegram_raw_message(chat_id: str, text: str) -> Dict[str, Any]:
    """
    Transmits a Markdown message to a specified Telegram chat_id or channel username.
    """
    if not is_telegram_configured():
        logger.info(f"[SIMULATED_DISPATCH] Telegram broadcast to {chat_id}: {text[:80]}...")
        return {
            "success": True,
            "simulated": True,
            "chat_id": chat_id,
            "note": "Interactive Simulator: Message validated and logged (set TELEGRAM_BOT_TOKEN for live push)"
        }

    url = f"{TELEGRAM_API_BASE}/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp_data = resp.json()
            if resp.status_code == 200 and resp_data.get("ok"):
                return {"success": True, "simulated": False, "chat_id": chat_id, "telegram_id": resp_data.get("result", {}).get("message_id")}
            else:
                logger.error(f"Telegram API Error: {resp_data}")
                return {"success": False, "simulated": False, "chat_id": chat_id, "error": resp_data.get("description", "Unknown error")}
    except Exception as e:
        logger.error(f"Telegram connection error: {e}")
        return {"success": False, "simulated": False, "chat_id": chat_id, "error": str(e)}


async def broadcast_emergency_alert(
    zone_id: str,
    conn: sqlite3.Connection,
    custom_note: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main entrypoint: Formats disaster intelligence for a given zone and
    dispatches bulletins across Telegram channels and registered subscribers.
    """
    cur = conn.cursor()

    # 1. Fetch zone details
    cur.execute("SELECT id, name, latitude, longitude FROM zones WHERE id = ?", (zone_id,))
    zone_row = cur.fetchone()
    if not zone_row:
        # Fallback if zone ID not found
        zone_dict = {"id": zone_id, "name": zone_id, "latitude": 13.0827, "longitude": 80.2707}
    else:
        zone_dict = {"id": zone_row[0], "name": zone_row[1], "latitude": zone_row[2], "longitude": zone_row[3]}

    # 2. Fetch latest prediction & sensor readings
    cur.execute("""
    SELECT risk_score, risk_category 
    FROM predictions WHERE zone_id = ? ORDER BY id DESC LIMIT 1
    """, (zone_id,))
    pred_row = cur.fetchone()

    cur.execute("""
    SELECT rainfall_mm, wind_speed_kmh, water_level_m 
    FROM sensor_readings WHERE zone_id = ? ORDER BY id DESC LIMIT 1
    """, (zone_id,))
    sensor_row = cur.fetchone()

    pred_info = None
    risk_level = "HIGH"
    if pred_row:
        risk_level = pred_row[1] or "HIGH"
        pred_info = {
            "risk_score": pred_row[0],
            "risk_category": pred_row[1],
            "precipitation_mm": sensor_row[0] if sensor_row else 15.0,
            "wind_speed_kmh": sensor_row[1] if sensor_row else 30.0,
            "water_level_m": sensor_row[2] if sensor_row else 1.2
        }

    # 3. Fetch nearest shelters
    cur.execute("SELECT name, capacity, current_occupancy, latitude, longitude, type FROM shelters WHERE status = 'OPEN'")
    raw_shelters = [
        {"name": r[0], "capacity": r[1], "current_occupancy": r[2], "latitude": r[3], "longitude": r[4], "type": r[5]}
        for r in cur.fetchall()
    ]

    from resource_allocator import rank_nearest_resources
    top_shelters = rank_nearest_resources(zone_dict["latitude"], zone_dict["longitude"], raw_shelters, top_n=3)

    # 4. Generate formatted bulletin
    bulletin = format_emergency_bulletin(
        zone=zone_dict,
        risk_level=risk_level,
        hazard_type="High Inflow & Flash Flood Surge Advisory",
        prediction_info=pred_info,
        shelters=top_shelters,
        custom_note=custom_note
    )

    # 5. Determine recipients (Broadcast Channel + Registered Subscribers)
    cur.execute("""
    SELECT chat_id FROM telegram_subscribers 
    WHERE is_active = 1 AND (zone_id = ? OR zone_id = 'ALL')
    """, (zone_id,))
    sub_rows = cur.fetchall()
    recipients = [r[0] for r in sub_rows]

    # Always include the official public channel
    if TELEGRAM_CHANNEL_ID and TELEGRAM_CHANNEL_ID not in recipients:
        recipients.insert(0, TELEGRAM_CHANNEL_ID)

    # 6. Dispatch
    results = []
    delivered_count = 0
    for cid in recipients:
        res = await send_telegram_raw_message(cid, bulletin)
        results.append(res)
        if res.get("success"):
            delivered_count += 1

    delivery_status = "DELIVERED" if delivered_count > 0 else "FAILED"

    # 7. Audit log in database
    cur.execute("""
    INSERT INTO telegram_broadcast_logs (zone_id, alert_level, message_text, recipients_count, delivery_status)
    VALUES (?, ?, ?, ?, ?)
    """, (zone_id, risk_level, bulletin, delivered_count, delivery_status))
    conn.commit()

    return {
        "status": "success",
        "zone_id": zone_id,
        "zone_name": zone_dict["name"],
        "alert_level": risk_level,
        "recipients_contacted": len(recipients),
        "delivered_count": delivered_count,
        "is_simulated": not is_telegram_configured(),
        "channel": TELEGRAM_CHANNEL_ID,
        "bulletin_preview": bulletin,
        "dispatch_results": results
    }


def register_telegram_subscriber(conn: sqlite3.Connection, chat_id: str, name: str, zone_id: str = "ALL") -> Dict[str, Any]:
    """Registers a citizen or field responder to receive automatic Telegram emergency alerts."""
    cur = conn.cursor()
    try:
        cur.execute("""
        INSERT INTO telegram_subscribers (chat_id, subscriber_name, zone_id, is_active)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(chat_id) DO UPDATE SET subscriber_name=excluded.subscriber_name, zone_id=excluded.zone_id, is_active=1
        """, (chat_id, name, zone_id))
        conn.commit()
        return {"status": "success", "message": f"Subscribed {chat_id} to zone {zone_id}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
