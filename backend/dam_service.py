"""
dam_service.py
Tamil Nadu Major Reservoirs & Dams Hydro-Safety Telemetry Engine.

Monitors the critical dams governing flood control across Tamil Nadu:
- Mettur Dam (Stanley Reservoir - Cauvery River)
- Chembarambakkam (Adyar River Basin, Chennai)
- Poondi Reservoir (Kosasthalaiyar River Basin)
- Red Hills / Puzhal (Chennai North Basin)
- Bhavanisagar Dam (Bhavani River, Erode)
- Vaigai Dam (Vaigai River, Theni / Madurai)
- Pechiparai Dam (Kodayar River, Kanyakumari)
- Amaravathi Dam (Amaravathi River, Tiruppur)
- Solaiyar Dam (Chalakudy/Anamalai Basin, Coimbatore)
- Aliyar Dam (Aliyar River, Coimbatore)

Features:
- Live capacity, inflow (cusecs), and discharge/outflow tracking
- Downstream river basin inundation impact analysis
- Automated Flood Warning issuance when capacity > 85% with high inflow
"""

import time
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

# Initial hydrological baseline parameters
TN_DAMS = [
    {
        "id": "mettur",
        "name": "Mettur Dam (Stanley Reservoir)",
        "name_ta": "மேட்டூர் அணை (ஸ்டான்லி நீர்த்தேக்கம்)",
        "district": "Salem",
        "district_id": "salem",
        "river": "Cauvery River",
        "river_ta": "காவிரி ஆறு",
        "latitude": 11.8038,
        "longitude": 77.8016,
        "frl_ft": 120.0,
        "current_level_ft": 104.2,
        "gross_capacity_tmc": 93.47,
        "current_storage_tmc": 72.8,
        "inflow_cusecs": 14200,
        "outflow_cusecs": 12000,
        "flood_discharge_threshold_cusecs": 50000,
        "downstream_districts": ["Erode", "Namakkal", "Karur", "Tiruchirappalli", "Thanjavur", "Nagapattinam"],
    },
    {
        "id": "chembarambakkam",
        "name": "Chembarambakkam Reservoir",
        "name_ta": "செம்பரம்பாக்கம் ஏரி",
        "district": "Chennai / Kanchipuram",
        "district_id": "chennai",
        "river": "Adyar River Basin",
        "river_ta": "அடையாறு வடிநிலம்",
        "latitude": 13.0116,
        "longitude": 80.0573,
        "frl_ft": 24.0,
        "current_level_ft": 19.8,
        "gross_capacity_mcft": 3645.0,
        "current_storage_mcft": 2780.0,
        "inflow_cusecs": 1850,
        "outflow_cusecs": 1200,
        "flood_discharge_threshold_cusecs": 6000,
        "downstream_districts": ["Chennai", "Kanchipuram", "Chengalpattu"],
    },
    {
        "id": "poondi",
        "name": "Poondi Reservoir (Sathyamurthy Sagar)",
        "name_ta": "பூண்டி நீர்த்தேக்கம்",
        "district": "Tiruvallur",
        "district_id": "tiruvallur",
        "river": "Kosasthalaiyar River",
        "river_ta": "கொசஸ்தலை ஆறு",
        "latitude": 13.1906,
        "longitude": 79.8601,
        "frl_ft": 35.0,
        "current_level_ft": 30.1,
        "gross_capacity_mcft": 3231.0,
        "current_storage_mcft": 2450.0,
        "inflow_cusecs": 920,
        "outflow_cusecs": 500,
        "flood_discharge_threshold_cusecs": 10000,
        "downstream_districts": ["Tiruvallur", "Chennai"],
    },
    {
        "id": "redhills",
        "name": "Red Hills (Puzhal Reservoir)",
        "name_ta": "புழல் ஏரி (செங்குன்றம்)",
        "district": "Chennai / Tiruvallur",
        "district_id": "chennai",
        "river": "Puzhal Basin",
        "river_ta": "புழல் வடிநிலம்",
        "latitude": 13.1583,
        "longitude": 80.1783,
        "frl_ft": 21.2,
        "current_level_ft": 17.5,
        "gross_capacity_mcft": 3300.0,
        "current_storage_mcft": 2490.0,
        "inflow_cusecs": 450,
        "outflow_cusecs": 280,
        "flood_discharge_threshold_cusecs": 3500,
        "downstream_districts": ["Chennai"],
    },
    {
        "id": "bhavanisagar",
        "name": "Bhavanisagar Dam",
        "name_ta": "பவானிசாகர் அணை",
        "district": "Erode",
        "district_id": "erode",
        "river": "Bhavani River",
        "river_ta": "பவானி ஆறு",
        "latitude": 11.4704,
        "longitude": 77.1136,
        "frl_ft": 105.0,
        "current_level_ft": 86.4,
        "gross_capacity_tmc": 32.8,
        "current_storage_tmc": 22.1,
        "inflow_cusecs": 3100,
        "outflow_cusecs": 2400,
        "flood_discharge_threshold_cusecs": 25000,
        "downstream_districts": ["Erode", "Tiruppur", "Karur"],
    },
    {
        "id": "vaigai",
        "name": "Vaigai Dam",
        "name_ta": "வைகை அணை",
        "district": "Theni",
        "district_id": "theni",
        "river": "Vaigai River",
        "river_ta": "வைகை ஆறு",
        "latitude": 10.0538,
        "longitude": 77.5886,
        "frl_ft": 71.0,
        "current_level_ft": 58.2,
        "gross_capacity_tmc": 6.1,
        "current_storage_tmc": 4.3,
        "inflow_cusecs": 1800,
        "outflow_cusecs": 1250,
        "flood_discharge_threshold_cusecs": 15000,
        "downstream_districts": ["Theni", "Dindigul", "Madurai", "Sivaganga", "Ramanathapuram"],
    },
    {
        "id": "pechiparai",
        "name": "Pechiparai Dam",
        "name_ta": "பேச்சிப்பாறை அணை",
        "district": "Kanyakumari",
        "district_id": "kanyakumari",
        "river": "Kodayar River",
        "river_ta": "கோதையாறு",
        "latitude": 8.4419,
        "longitude": 77.2947,
        "frl_ft": 48.0,
        "current_level_ft": 39.5,
        "gross_capacity_tmc": 5.2,
        "current_storage_tmc": 3.9,
        "inflow_cusecs": 780,
        "outflow_cusecs": 650,
        "flood_discharge_threshold_cusecs": 8000,
        "downstream_districts": ["Kanyakumari"],
    },
    {
        "id": "amaravathi",
        "name": "Amaravathi Dam",
        "name_ta": "அமராவதி அணை",
        "district": "Tiruppur",
        "district_id": "tiruppur",
        "river": "Amaravathi River",
        "river_ta": "அமராவதி ஆறு",
        "latitude": 10.4283,
        "longitude": 77.2661,
        "frl_ft": 90.0,
        "current_level_ft": 72.8,
        "gross_capacity_tmc": 4.0,
        "current_storage_tmc": 2.9,
        "inflow_cusecs": 850,
        "outflow_cusecs": 700,
        "flood_discharge_threshold_cusecs": 12000,
        "downstream_districts": ["Tiruppur", "Karur"],
    },
    {
        "id": "solaiyar",
        "name": "Solaiyar Dam",
        "name_ta": "சோலையாறு அணை (வால்பாறை)",
        "district": "Coimbatore",
        "district_id": "coimbatore",
        "river": "Chalakudy River Basin",
        "river_ta": "சாலக்குடி வடிநிலம்",
        "latitude": 10.3014,
        "longitude": 76.9389,
        "frl_ft": 160.0,
        "current_level_ft": 138.4,
        "gross_capacity_tmc": 5.0,
        "current_storage_tmc": 3.8,
        "inflow_cusecs": 1100,
        "outflow_cusecs": 850,
        "flood_discharge_threshold_cusecs": 9000,
        "downstream_districts": ["Coimbatore"],
    },
    {
        "id": "aliyar",
        "name": "Aliyar Dam",
        "name_ta": "ஆழியாறு அணை",
        "district": "Coimbatore",
        "district_id": "coimbatore",
        "river": "Aliyar River",
        "river_ta": "ஆழியாறு",
        "latitude": 10.4851,
        "longitude": 76.9744,
        "frl_ft": 120.0,
        "current_level_ft": 102.6,
        "gross_capacity_tmc": 3.8,
        "current_storage_tmc": 2.7,
        "inflow_cusecs": 620,
        "outflow_cusecs": 510,
        "flood_discharge_threshold_cusecs": 7000,
        "downstream_districts": ["Coimbatore"],
    }
]


def _compute_dam_status(dam: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes storage capacity %, safety category, and downstream flood warning status.
    """
    # Determine capacity percentage based on TMC or Mcft
    if "gross_capacity_tmc" in dam:
        cap_pct = round((dam["current_storage_tmc"] / dam["gross_capacity_tmc"]) * 100.0, 1)
        storage_disp = f"{dam['current_storage_tmc']} / {dam['gross_capacity_tmc']} TMC"
    else:
        cap_pct = round((dam["current_storage_mcft"] / dam["gross_capacity_mcft"]) * 100.0, 1)
        storage_disp = f"{dam['current_storage_mcft']} / {dam['gross_capacity_mcft']} Mcft"

    level_pct = round((dam["current_level_ft"] / dam["frl_ft"]) * 100.0, 1)
    outflow = dam.get("outflow_cusecs", 0)
    inflow = dam.get("inflow_cusecs", 0)
    flood_threshold = dam.get("flood_discharge_threshold_cusecs", 10000)

    # Risk categorization
    if cap_pct >= 92.0 or outflow >= flood_threshold:
        status_category = "CRITICAL_SURCHARGE"
        warning_en = f"CRITICAL: {dam['name']} at {cap_pct}% capacity. High discharge ({outflow:,} cusecs). Downstream river basin flood warning active!"
        warning_ta = f"அதிதீவிர எச்சரிக்கை: {dam['name_ta']} {cap_pct}% நிரம்பியுள்ளது. உபரி நீர் வெளியேற்றம் ({outflow:,} கனஅடி). ஆற்றுப்படுகை மக்களுக்கு வெள்ள அபாய எச்சரிக்கை!"
    elif cap_pct >= 85.0 or (cap_pct >= 80.0 and inflow > outflow * 1.8):
        status_category = "HIGH_ALERT"
        warning_en = f"ALERT: {dam['name']} storage at {cap_pct}%. Precautionary surplus outflow discharging."
        warning_ta = f"எச்சரிக்கை: {dam['name_ta']} நீர்மட்டம் {cap_pct}%. உபரி நீர் திறக்கப்பட வாய்ப்பு."
    elif cap_pct >= 70.0:
        status_category = "MODERATE_STORAGE"
        warning_en = f"Normal heavy monsoon storage at {cap_pct}%. Water level monitored regularly."
        warning_ta = f"வழக்கமான நீர் இருப்பு ({cap_pct}%). தொடர் கண்காணிப்பில் உள்ளது."
    else:
        status_category = "NORMAL_STORAGE"
        warning_en = f"Safe storage at {cap_pct}%. Substantial buffer available."
        warning_ta = f"பாதுகாப்பான நீர் இருப்பு ({cap_pct}%)."

    return {
        **dam,
        "storage_pct": cap_pct,
        "water_level_pct": level_pct,
        "storage_display": storage_disp,
        "status_category": status_category,
        "warning_en": warning_en,
        "warning_ta": warning_ta,
        "is_danger": status_category in ["CRITICAL_SURCHARGE", "HIGH_ALERT"]
    }


def get_all_dams_status() -> List[Dict[str, Any]]:
    """Returns hydro-safety status for all Tamil Nadu monitored dams."""
    return [_compute_dam_status(d) for d in TN_DAMS]


def get_dam_by_id(dam_id: str) -> Optional[Dict[str, Any]]:
    """Finds a dam by ID."""
    for d in TN_DAMS:
        if d["id"].lower() == dam_id.lower():
            return _compute_dam_status(d)
    return None


def get_downstream_warnings() -> List[Dict[str, Any]]:
    """Filters only dams with active downstream flood warnings."""
    all_dams = get_all_dams_status()
    return [d for d in all_dams if d["is_danger"]]


def update_dam_telemetry(dam_id: str, new_inflow: Optional[int] = None, new_outflow: Optional[int] = None, new_storage: Optional[float] = None) -> Optional[Dict[str, Any]]:
    """Allows simulated crisis spikes or real sensor input to update dam flow."""
    for d in TN_DAMS:
        if d["id"].lower() == dam_id.lower():
            if new_inflow is not None:
                d["inflow_cusecs"] = new_inflow
            if new_outflow is not None:
                d["outflow_cusecs"] = new_outflow
            if new_storage is not None:
                if "gross_capacity_tmc" in d:
                    d["current_storage_tmc"] = min(new_storage, d["gross_capacity_tmc"])
                else:
                    d["current_storage_mcft"] = min(new_storage, d["gross_capacity_mcft"])
            return _compute_dam_status(d)
    return None
