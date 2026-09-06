"""
main.py
AI Disaster Intelligence & Response Platform -- Backend

Run with:
    uvicorn main:app --reload --port 8000

Then open http://localhost:8000 in your browser.
"""

import asyncio
import json
import random
import os
import time
from datetime import datetime
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from database import init_db, get_conn
from prediction_engine import SensorInput, predict_all, highest_risk
from resource_allocator import rank_nearest_resources
from weather_service import fetch_live_tamilnadu_weather

SYSTEM_MODE = "LIVE_OPEN_METEO"  # "LIVE_OPEN_METEO" (Real Satellite Weather) or "SIMULATION_DRILL"
LATEST_LIVE_WEATHER = {}
LAST_WEATHER_SYNC_TIME = 0

app = FastAPI(title="AI Disaster Intelligence & Response Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class SensorReadingIn(BaseModel):
    zone_id: str
    rainfall_mm: float
    water_level_m: float
    wind_speed_kmh: float
    seismic_magnitude: float
    soil_saturation: float


class AlertOut(BaseModel):
    zone_id: str
    disaster_type: str
    severity: str
    message: str
    channels: List[str]
    population_affected: int


# ---------------------------------------------------------------------------
# Connection manager for live WebSocket broadcast (dashboard + alerts)
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, payload: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(ws)
        for d in dead:
            self.disconnect(d)


manager = ConnectionManager()

ALERT_CHANNEL_MAP = {
    "CRITICAL": ["SMS", "PUSH", "APP_BANNER", "SIREN"],
    "HIGH": ["SMS", "PUSH", "APP_BANNER"],
    "MODERATE": ["PUSH", "APP_BANNER"],
    "LOW": ["APP_BANNER"],
}


# ---------------------------------------------------------------------------
# Core prediction + alert pipeline (reused by API and simulator)
# ---------------------------------------------------------------------------

def run_prediction_pipeline(reading: SensorReadingIn) -> dict:
    sensor = SensorInput(**reading.dict())
    results = predict_all(sensor)
    top = highest_risk(results)

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO sensor_readings
               (zone_id, rainfall_mm, water_level_m, wind_speed_kmh, seismic_magnitude, soil_saturation)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (reading.zone_id, reading.rainfall_mm, reading.water_level_m,
             reading.wind_speed_kmh, reading.seismic_magnitude, reading.soil_saturation),
        )
        for r in results:
            cur.execute(
                """INSERT INTO predictions
                   (zone_id, disaster_type, risk_score, risk_category, confidence, contributing_factors)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (r.zone_id, r.disaster_type, r.risk_score, r.risk_category,
                 r.confidence, "; ".join(r.contributing_factors)),
            )

        zone_row = cur.execute("SELECT * FROM zones WHERE id = ?", (reading.zone_id,)).fetchone()
        alert_record = None

        if top.risk_category in ("HIGH", "CRITICAL") and zone_row is not None:
            channels = ALERT_CHANNEL_MAP[top.risk_category]
            message = (
                f"{top.risk_category} {top.disaster_type} risk detected in {zone_row['name']}. "
                f"Risk score {top.risk_score}/100. Follow evacuation guidance immediately."
                if top.risk_category == "CRITICAL"
                else f"{top.risk_category} {top.disaster_type} risk in {zone_row['name']}. Stay alert and monitor updates."
            )
            cur.execute(
                """INSERT INTO alerts (zone_id, disaster_type, severity, message, channels, population_affected)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (reading.zone_id, top.disaster_type, top.risk_category, message,
                 json.dumps(channels), zone_row["population"]),
            )
            alert_record = {
                "zone_id": reading.zone_id,
                "zone_name": zone_row["name"],
                "disaster_type": top.disaster_type,
                "severity": top.risk_category,
                "message": message,
                "channels": channels,
                "population_affected": zone_row["population"],
                "timestamp": datetime.utcnow().isoformat(),
            }

        conn.commit()

    zone_dict = dict(zone_row) if zone_row else {"id": reading.zone_id, "name": reading.zone_id}

    resources = []
    if alert_record:
        with get_conn() as conn:
            shelters = [dict(r) for r in conn.execute("SELECT * FROM shelters").fetchall()]
        resources = rank_nearest_resources(zone_dict["latitude"], zone_dict["longitude"], shelters, top_n=3)

    return {
        "zone": zone_dict,
        "predictions": [r.__dict__ for r in results],
        "top_risk": top.__dict__,
        "alert": alert_record,
        "nearest_resources": resources,
    }


# ---------------------------------------------------------------------------
# REST API
# ---------------------------------------------------------------------------

@app.get("/api/zones")
def get_zones():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM zones").fetchall()
    return [dict(r) for r in rows]


@app.get("/api/shelters")
def get_shelters():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM shelters").fetchall()
    return [dict(r) for r in rows]


@app.post("/api/predict")
async def predict(reading: SensorReadingIn):
    result = run_prediction_pipeline(reading)
    await manager.broadcast({"type": "prediction_update", "data": result})
    if result["alert"]:
        await manager.broadcast({"type": "new_alert", "data": result["alert"]})
    return result


@app.get("/api/alerts")
def get_alerts(limit: int = 20):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/resources/nearest/{zone_id}")
def nearest_resources(zone_id: str, top_n: int = 5):
    with get_conn() as conn:
        zone = conn.execute("SELECT * FROM zones WHERE id = ?", (zone_id,)).fetchone()
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        shelters = [dict(r) for r in conn.execute("SELECT * FROM shelters").fetchall()]
    return rank_nearest_resources(zone["latitude"], zone["longitude"], shelters, top_n=top_n)


@app.get("/api/dashboard/summary")
def dashboard_summary():
    with get_conn() as conn:
        total_alerts = conn.execute("SELECT COUNT(*) c FROM alerts").fetchone()["c"]
        critical_alerts = conn.execute(
            "SELECT COUNT(*) c FROM alerts WHERE severity = 'CRITICAL'"
        ).fetchone()["c"]
        zones_monitored = conn.execute("SELECT COUNT(*) c FROM zones").fetchone()["c"]
        shelters_available = conn.execute(
            "SELECT COUNT(*) c FROM shelters WHERE status = 'AVAILABLE'"
        ).fetchone()["c"]
        latest_predictions = conn.execute(
            "SELECT * FROM predictions ORDER BY id DESC LIMIT 10"
        ).fetchall()
    return {
        "total_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "zones_monitored": zones_monitored,
        "shelters_available": shelters_available,
        "latest_predictions": [dict(r) for r in latest_predictions],
    }


@app.post("/api/simulate/disaster/{zone_id}")
async def simulate_disaster(zone_id: str):
    """Manually spike sensor readings for a zone to demo the full pipeline live (for judges)."""
    reading = SensorReadingIn(
        zone_id=zone_id,
        rainfall_mm=round(random.uniform(90, 160), 1),
        water_level_m=round(random.uniform(4.2, 6.5), 2),
        wind_speed_kmh=round(random.uniform(85, 140), 1),
        seismic_magnitude=round(random.uniform(3.0, 5.5), 1),
        soil_saturation=round(random.uniform(78, 98), 1),
    )
    result = run_prediction_pipeline(reading)
    await manager.broadcast({"type": "prediction_update", "data": result})
    if result["alert"]:
        await manager.broadcast({"type": "new_alert", "data": result["alert"]})
    return result


@app.get("/api/weather/live")
def get_live_weather():
    """Return latest live satellite weather readings for all monitored zones."""
    return {
        "mode": SYSTEM_MODE,
        "source": "Open-Meteo (ECMWF/NOAA Live Satellite)",
        "last_sync": LAST_WEATHER_SYNC_TIME,
        "zones": LATEST_LIVE_WEATHER
    }


@app.get("/api/system/mode")
def get_system_mode():
    return {
        "mode": SYSTEM_MODE,
        "source": "Open-Meteo (ECMWF/NOAA Live Satellite)" if SYSTEM_MODE == "LIVE_OPEN_METEO" else "Simulation Disaster Drill"
    }


@app.post("/api/system/mode/{mode}")
async def set_system_mode(mode: str):
    global SYSTEM_MODE
    mode_upper = mode.upper()
    if "LIVE" in mode_upper:
        SYSTEM_MODE = "LIVE_OPEN_METEO"
        await sync_live_weather()
    else:
        SYSTEM_MODE = "SIMULATION_DRILL"
    await manager.broadcast({
        "type": "system_mode_update",
        "mode": SYSTEM_MODE,
        "source": "Open-Meteo Live Satellite" if SYSTEM_MODE == "LIVE_OPEN_METEO" else "Disaster Drill Simulator"
    })
    return {"mode": SYSTEM_MODE, "status": "updated"}


@app.post("/api/weather/sync")
async def force_weather_sync():
    """Forces an immediate live satellite sync from Open-Meteo."""
    synced = await sync_live_weather()
    return {"status": "success", "zones_synced": synced, "mode": SYSTEM_MODE}


async def sync_live_weather() -> int:
    """Fetch 100% real live satellite observations and update predictions."""
    global LATEST_LIVE_WEATHER, LAST_WEATHER_SYNC_TIME
    try:
        with get_conn() as conn:
            zones = [dict(r) for r in conn.execute("SELECT * FROM zones").fetchall()]
        if not zones:
            return 0
        weather_map = fetch_live_tamilnadu_weather(zones)
        if not weather_map:
            return 0
        
        LATEST_LIVE_WEATHER = weather_map
        LAST_WEATHER_SYNC_TIME = int(time.time())

        # Update sensor readings & predictions for all zones with live data
        for zone in zones:
            w = weather_map.get(zone["id"])
            if not w:
                continue
            reading = SensorReadingIn(
                zone_id=zone["id"],
                rainfall_mm=w["rainfall_mm"],
                water_level_m=w["water_level_m"],
                wind_speed_kmh=w["wind_speed_kmh"],
                seismic_magnitude=w["seismic_magnitude"],
                soil_saturation=w["soil_saturation"],
            )
            res = run_prediction_pipeline(reading)
            res["weather_info"] = w
            res["is_live"] = True
            await manager.broadcast({"type": "prediction_update", "data": res})
            if res["alert"]:
                await manager.broadcast({"type": "new_alert", "data": res["alert"]})

        await manager.broadcast({
            "type": "system_mode_update",
            "mode": SYSTEM_MODE,
            "source": "Open-Meteo (ECMWF/NOAA Live Satellite)",
            "last_sync": LAST_WEATHER_SYNC_TIME,
            "weather": LATEST_LIVE_WEATHER
        })
        return len(weather_map)
    except Exception as e:
        print("[LiveWeatherSync] Error syncing live weather:", e)
        return 0


# ---------------------------------------------------------------------------
# Background live sensor loop: Live Open-Meteo or Emergency Drill Simulator
# ---------------------------------------------------------------------------

async def live_sensor_loop():
    # Immediate live sync upon server start
    await asyncio.sleep(1)
    await sync_live_weather()

    last_meteo_sync = time.time()

    while True:
        await asyncio.sleep(4)
        try:
            if SYSTEM_MODE == "LIVE_OPEN_METEO":
                # Resync live real-world satellite weather every 40 seconds
                if time.time() - last_meteo_sync >= 40:
                    await sync_live_weather()
                    last_meteo_sync = time.time()
            else:
                # Drill / Simulation mode: Perturbs readings to showcase critical scenarios
                with get_conn() as conn:
                    zones = conn.execute("SELECT id, name FROM zones").fetchall()
                if not zones:
                    continue
                zone = random.choice(zones)
                zone_id = zone["id"]
                zone_name = zone["name"].lower()

                if "nilgiris" in zone_name or "hills" in zone_name or "kodaikanal" in zone_name:
                    rainfall = round(random.uniform(25, 95), 1)
                    water_level = round(random.uniform(1.0, 3.5), 2)
                    wind_speed = round(random.uniform(15, 60), 1)
                    seismic = round(random.uniform(1.0, 3.8), 1)
                    soil_sat = round(random.uniform(55, 92), 1)
                elif any(c in zone_name for c in ["coastal", "coast", "cape", "port", "rameswaram"]):
                    rainfall = round(random.uniform(20, 85), 1)
                    water_level = round(random.uniform(2.0, 4.8), 2)
                    wind_speed = round(random.uniform(40, 105), 1)
                    seismic = round(random.uniform(0.5, 2.0), 1)
                    soil_sat = round(random.uniform(35, 75), 1)
                else:
                    rainfall = round(random.uniform(15, 80), 1)
                    water_level = round(random.uniform(2.2, 5.2), 2)
                    wind_speed = round(random.uniform(15, 55), 1)
                    seismic = round(random.uniform(0.5, 2.0), 1)
                    soil_sat = round(random.uniform(40, 85), 1)

                reading = SensorReadingIn(
                    zone_id=zone_id,
                    rainfall_mm=rainfall,
                    water_level_m=water_level,
                    wind_speed_kmh=wind_speed,
                    seismic_magnitude=seismic,
                    soil_saturation=soil_sat,
                )
                result = run_prediction_pipeline(reading)
                result["is_live"] = False
                await manager.broadcast({"type": "prediction_update", "data": result})
                if result["alert"]:
                    await manager.broadcast({"type": "new_alert", "data": result["alert"]})
        except Exception as e:
            print("[SensorLoop] Error:", e)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(live_sensor_loop())


# ---------------------------------------------------------------------------
# WebSocket endpoint for the live dashboard
# ---------------------------------------------------------------------------

@app.websocket("/ws/live")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Serve frontend (React + Tailwind Production Build)
# ---------------------------------------------------------------------------

DIST_DIR = os.path.join(FRONTEND_DIR, "dist")
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


@app.get("/")
def serve_index():
    if os.path.exists(os.path.join(DIST_DIR, "index.html")):
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

