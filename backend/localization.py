"""
localization.py
Bilingual (தமிழ் / English) Disaster Terminology & UI Localization Engine for Tamil Nadu.

Provides standardized disaster domain vocabulary, district names, emergency instructions,
and full UI translation bundles.
"""

from typing import Dict, Any

DISTRICT_NAMES_TA = {
    "chennai": "சென்னை",
    "nilgiris": "நீலகிரி",
    "cuddalore": "கடலூர்",
    "madurai": "மதுரை",
    "coimbatore": "கோயம்புத்தூர்",
    "kanyakumari": "கன்னியாகுமரி",
    "tiruchirappalli": "திருச்சிராப்பள்ளி",
    "salem": "சேலம்",
    "tirunelveli": "திருநெல்வேலி",
    "vellore": "வேலூர்",
    "thanjavur": "தஞ்சாவூர்",
    "dindigul": "திண்டுக்கல்",
    "erode": "ஈரோடு",
    "tiruppur": "திருப்பூர்",
    "nagapattinam": "நாகப்பட்டினம்",
    "kanchipuram": "காஞ்சிபுரம்",
    "tiruvallur": "திருவள்ளூர்",
    "thoothukudi": "தூத்துக்குடி"
}

DISASTER_TYPES_TA = {
    "FLOOD": "பெருவெள்ளம்",
    "FLASH_FLOOD": "திடீர் வெள்ளப்பெருக்கு",
    "CYCLONE": "தீவிர புயல் காற்று",
    "LANDSLIDE": "மண் மற்றும் நிலச்சரிவு",
    "HEATWAVE": "அனல் காற்று பாதிப்பு",
    "DROUGHT": "கடும் வறட்சி",
    "MONITORING": "வழக்கமான கண்காணிப்பு",
    "🚨 CITIZEN SOS RESCUE": "🚨 அவசர மீட்பு எஸ்.ஓ.எஸ்"
}

RISK_LEVELS = {
    "en": {
        "LOW": "Low Risk",
        "MODERATE": "Moderate",
        "HIGH": "High Risk",
        "CRITICAL": "Critical Alert"
    },
    "ta": {
        "LOW": "பாதுகாப்பானது",
        "MODERATE": "மிதமானது",
        "HIGH": "அதிக இடர்",
        "CRITICAL": "அதிதீவிர அபாயம்"
    }
}

UI_STRINGS = {
    "en": {
        "title": "Tamil Nadu Disaster Intelligence & Response",
        "subtitle": "Statewide Real-time Hazard Monitoring",
        "search_placeholder": "Search District (e.g. Nilgiris, Madurai, Cuddalore...)",
        "live_map_title": "Live Risk Map — Tamil Nadu Statewide Monitor",
        "districts_monitored": "Districts Monitored",
        "total_alerts": "Total Alerts",
        "critical_alerts": "Critical Alerts",
        "shelters_active": "Active Shelters",
        "satellite_live": "Satellite Live",
        "test_drill": "Test Drill",
        "whole_tn": "Whole TN",
        "sync_satellite": "Sync Satellite",
        "district_monitor_title": "Tamil Nadu District Monitor",
        "risk_sorted": "Ranked by Live Risk Severity",
        "alert_feed_title": "Live Emergency Alert Broadcast",
        "active_dispatches": "Dispatches",
        "offline_plan_btn": "Offline Plan (PDF)",
        "trigger_spike": "Trigger Crisis Spike",
        "statewide_overview": "Statewide Overview",
        "focused": "Focused",
        "rain": "Rain",
        "wind": "Wind",
        "temp": "Temp",
        "humidity": "Humidity",
        "dams_title": "TN Major Reservoirs",
        "marine_title": "Coastal Marine Bulletin",
    },
    "ta": {
        "title": "தமிழ்நாடு பேரிடர் மேலாண்மை & அவசர தளம்",
        "subtitle": "மாநில அளவிலான நேரடி இடர் கண்காணிப்பு",
        "search_placeholder": "மாவட்டத்தை தேடவும் (எ.கா: நீலகிரி, மதுரை, கடலூர்...)",
        "live_map_title": "நேரடி இடர் வரைபடம் — தமிழ்நாடு மாநில கண்காணிப்பு",
        "districts_monitored": "கண்காணிக்கப்படும் மாவட்டங்கள்",
        "total_alerts": "மொத்த எச்சரிக்கைகள்",
        "critical_alerts": "அவசர எச்சரிக்கைகள்",
        "shelters_active": "பாதுகாப்பு முகாம்கள்",
        "satellite_live": "செயற்கைக்கோள் நேரலை",
        "test_drill": "மாதிரி பயிற்சி",
        "whole_tn": "தமிழ்நாடு முழுமைக்கும்",
        "sync_satellite": "செயற்கைக்கோள் புதுப்பித்தல்",
        "district_monitor_title": "தமிழ்நாடு மாவட்ட கண்காணிப்பு",
        "risk_sorted": "இடர் அளவின்படி வரிசைப்படுத்தப்பட்டது",
        "alert_feed_title": "நேரடி அவசர எச்சரிக்கை ஒளிபரப்பு",
        "active_dispatches": "செயலில் உள்ள தகவல்கள்",
        "offline_plan_btn": "அவசர கால வழிகாட்டி (PDF)",
        "trigger_spike": "ஆபத்து மாதிரி பயிற்சி",
        "statewide_overview": "மாநில பொதுப்பார்வை",
        "focused": "தேர்வு செய்யப்பட்டது",
        "rain": "மழை",
        "wind": "காற்று",
        "temp": "வெப்பம்",
        "humidity": "ஈரப்பதம்",
        "dams_title": "முக்கிய அணைகள் நீர்மட்டம்",
        "marine_title": "கடலோர வானிலை & அலை உயரம்",
    }
}


def get_localized_strings(lang: str = "en") -> Dict[str, Any]:
    """Returns the full dictionary bundle for requested language ('en' or 'ta')."""
    active_lang = "ta" if lang.lower() in ["ta", "tamil"] else "en"
    return {
        "lang": active_lang,
        "ui": UI_STRINGS[active_lang],
        "risk_levels": RISK_LEVELS[active_lang],
        "districts_ta": DISTRICT_NAMES_TA,
        "disaster_types_ta": DISASTER_TYPES_TA
    }


def localize_district_name(district_id: str, default_name: str, lang: str = "en") -> str:
    """Returns localized district name (e.g. 'நீலகிரி' if 'ta', else 'Nilgiris')."""
    if lang.lower() in ["ta", "tamil"]:
        clean_id = district_id.lower().strip()
        return DISTRICT_NAMES_TA.get(clean_id, default_name)
    return default_name
