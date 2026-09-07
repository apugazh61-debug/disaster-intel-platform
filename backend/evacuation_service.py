"""
evacuation_service.py
Offline Evacuation Advisory & Emergency Action Plan Generator for Tamil Nadu.

Generates structured emergency action plans and clean, self-contained printable
HTML documents that can be printed or saved as offline PDFs before severe cyclones/floods
knock out power and cellular infrastructure.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from resource_allocator import rank_nearest_resources
from database import get_conn

# Standard Tamil Nadu Emergency Helpline Directory
TN_HELPLINES = [
    {"service": "State Disaster Control Room (SEOC)", "service_ta": "மாநில பேரிடர் கட்டுப்பாட்டு மையம்", "number": "1070", "timing": "24x7 Toll Free"},
    {"service": "District Collector Disaster Helpline (DDMA)", "service_ta": "மாவட்ட ஆட்சியர் பேரிடர் உதவி எண்", "number": "1077", "timing": "24x7 Direct"},
    {"service": "Police Emergency", "service_ta": "காவல்துறை அவசர உதவி", "number": "112 / 100", "timing": "24x7 Immediate"},
    {"service": "Ambulance & Trauma Medical Care", "service_ta": "ஆம்புலன்ஸ் அவசர சிகிச்சை", "number": "108", "timing": "24x7 Medical"},
    {"service": "Tamil Nadu Fire & Rescue Services", "service_ta": "தீயணைப்பு மற்றும் மீட்புப் பணி", "number": "101", "timing": "24x7 Rescue"},
    {"service": "Indian Coast Guard (Fishermen / Maritime)", "service_ta": "இந்திய கடலோரக் காவல் படை", "number": "1554", "timing": "Maritime SOS"},
    {"service": "Electricity Breakdown (TANGEDCO Minnagam)", "service_ta": "மின்சார வாரிய அவசர உதவி (மின்னகம்)", "number": "94987 94987", "timing": "24x7"},
    {"service": "Women Emergency Helpline", "service_ta": "பெண்கள் அவசர உதவி எண்", "number": "181", "timing": "24x7"},
    {"service": "Childline Support", "service_ta": "குழந்தைகள் அவசர உதவி", "number": "1098", "timing": "24x7"},
]

EMERGENCY_KIT_CHECKLIST = [
    {"item_en": "Drinking water bottles (min 3 litres per person for 72 hours)", "item_ta": "குடிநீர் பாட்டில்கள் (ஒரு நபருக்கு குறைந்தபட்சம் 3 லிட்டர் வீதம் 3 நாட்களுக்கு)"},
    {"item_en": "Non-perishable food (biscuits, dry fruits, energy bars)", "item_ta": "கெட்டுப்போகாத உலர் உணவுகள் (பிஸ்கட், உலர் பழங்கள்)"},
    {"item_en": "Battery torchlight, spare batteries & fully charged power bank", "item_ta": "பேட்டரி டார்ச் விளக்கு, கூடுதல் பேட்டரிகள் & பவர் பேங்க்"},
    {"item_en": "Personal essential medications and first-aid supplies", "item_ta": "அத்தியாவசிய தினசரி மருந்துகள் & முதலுதவிப் பொருட்கள்"},
    {"item_en": "Aadhaar, Ration card & property documents sealed in waterproof ziplock", "item_ta": "ஆதார், குடும்ப அட்டை, சொத்து ஆவணங்களை நீர் புகா பையில் பத்திரப்படுத்துதல்"},
    {"item_en": "Adequate cash (ATMs and UPI may fail during power cuts)", "item_ta": "கையில் போதுமான ரொக்கப் பணம் (மின்தடையின்போது ATM/UPI செயல்படாது)"},
    {"item_en": "Whistle to attract attention of rescue boats if marooned", "item_ta": "வெள்ளத்தில் சிக்கினால் மீட்புக் குழுவினரை அழைக்க விசில்"},
]

DOS_AND_DONTS = {
    "dos": [
        "Move to upper floors or designated relief shelters immediately upon alert.",
        "Turn off main electrical switch and LPG cylinder regulator before evacuating.",
        "Keep mobile phones on ultra battery saver mode; use SMS instead of calls to preserve battery.",
        "Help elderly persons, pregnant women, and disabled neighbors reach safety."
    ],
    "dos_ta": [
        "எச்சரிக்கை வந்தவுடன் உடனடியாக மேடான தளங்கள் அல்லது நிவாரண முகாம்களுக்கு செல்லவும்.",
        "வீட்டை விட்டு வெளியேறும் முன் வீட்டின் மெயின் சுவிட்ச் மற்றும் கேஸ் சிலிண்டரை அணைக்கவும்.",
        "மொபைல் போனை பேட்டரி சேவர் மோடில் வைக்கவும்; பேட்டரியை மிச்சப்படுத்த SMS பயன்படுத்தவும்.",
        "முதியவர்கள், கர்ப்பிணிகள் மற்றும் மாற்றுத்திறனாளிகளை பாதுகாப்பான இடங்களுக்கு அழைத்துச் செல்ல உதவவும்."
    ],
    "donts": [
        "Do NOT walk, swim, or drive through flowing floodwaters (Turn Around, Don't Drown).",
        "Do NOT touch fallen electric poles, sagging cables, or submerged transformers.",
        "Do NOT consume unboiled water or food that came in contact with floodwater.",
        "Do NOT spread unverified rumors on WhatsApp/social media; follow official TNDMA advisories."
    ],
    "donts_ta": [
        "பெருக்கெடுத்து ஓடும் வெள்ள நீரில் ஒருபோதும் நடக்கவோ, நீந்தவோ, வாகனங்களை ஓட்டவோ வேண்டாம்.",
        "அறுந்து கிடக்கும் மின்கம்பிகள், சாய்ந்த மின்கம்பங்கள் அல்லது நீரில் மூழ்கிய மின்சார பெட்டிகளை தொடாதீர்கள்.",
        "வெள்ள நீர் கலந்த அல்லது காய்ச்சாத தண்ணீரை அருந்த வேண்டாம்.",
        "வாட்ஸ்அப் வதந்திகளை பரப்ப வேண்டாம்; அதிகாரப்பூர்வ TNDMA தகவல்களை மட்டுமே நம்புங்கள்."
    ]
}


def generate_district_evacuation_data(zone: Dict[str, Any], shelters: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compiles full structured emergency data for a specific district.
    """
    # Find nearest shelters to the district center
    ranked_shelters = rank_nearest_resources(
        zone["latitude"], zone["longitude"], shelters, top_n=5
    )

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%d %B %Y, %I:%M %p UTC"),
        "district": {
            "id": zone["id"],
            "name": zone["name"],
            "latitude": zone["latitude"],
            "longitude": zone["longitude"],
            "elevation_m": zone.get("elevation_m", 15),
            "distance_to_coast_km": zone.get("distance_to_coast_km", 20),
            "population_density": zone.get("population_density", 2500)
        },
        "helplines": TN_HELPLINES,
        "emergency_kit": EMERGENCY_KIT_CHECKLIST,
        "rules": DOS_AND_DONTS,
        "designated_shelters": ranked_shelters
    }


def render_printable_evacuation_html(zone: Dict[str, Any], shelters: List[Dict[str, Any]]) -> str:
    """
    Renders an elegant, self-contained, print-styled HTML advisory.
    """
    data = generate_district_evacuation_data(zone, shelters)
    zname = data["district"]["name"]
    shelters_rows = ""
    for idx, s in enumerate(data["designated_shelters"], 1):
        s_name = s.get('name', 'Relief Shelter')
        s_type = s.get('address') or f"Type: {s.get('type', 'Relief Camp')}"
        s_cap = int(s.get('capacity') or 500)
        s_dist = s.get('distance_km', 0.0)
        shelters_rows += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: 700; color: #0284c7;">#{idx}</td>
            <td style="padding: 10px; font-weight: 600; color: #0f172a;">{s_name}</td>
            <td style="padding: 10px; color: #475569; font-size: 13px;">{s_type}</td>
            <td style="padding: 10px; color: #0f172a; font-weight: 600;">{s_cap:,} persons</td>
            <td style="padding: 10px; font-weight: 700; color: #059669;">{s_dist} km</td>
        </tr>
        """

    helplines_html = ""
    for h in data["helplines"]:
        helplines_html += f"""
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a;">{h['service']}</div>
                <div style="font-size: 12px; color: #0284c7; font-weight: 600;">{h['service_ta']}</div>
            </div>
            <div style="font-size: 17px; font-weight: 900; color: #dc2626; background: #fee2e2; padding: 4px 10px; border-radius: 6px; border: 1px solid #fca5a5;">
                {h['number']}
            </div>
        </div>
        """

    kit_html = ""
    for idx, k in enumerate(data["emergency_kit"], 1):
        kit_html += f"""
        <li style="margin-bottom: 8px; font-size: 13px; color: #1e293b;">
            <strong>[ ] {k['item_en']}</strong><br/>
            <span style="color: #64748b; font-size: 12px;">{k['item_ta']}</span>
        </li>
        """

    dos_html = "".join([f"<li style='color: #15803d; margin-bottom: 6px; font-size: 13px;'>{d}</li>" for d in data["rules"]["dos"]])
    donts_html = "".join([f"<li style='color: #b91c1c; margin-bottom: 6px; font-size: 13px;'>{d}</li>" for d in data["rules"]["donts"]])

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Emergency Evacuation Action Plan — {zname} District</title>
    <style>
        @page {{ size: A4 portrait; margin: 15mm; }}
        body {{ font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 24px; line-height: 1.45; }}
        .header {{ border-bottom: 3px solid #0284c7; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }}
        .stamp {{ background: #fef2f2; border: 2px solid #ef4444; color: #dc2626; padding: 4px 12px; font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 18px; }}
        th {{ background: #f1f5f9; padding: 10px; font-size: 12px; font-weight: 700; text-align: left; border-bottom: 2px solid #cbd5e1; color: #334155; text-transform: uppercase; }}
        .print-btn {{ background: #0284c7; color: #fff; border: none; padding: 10px 22px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }}
        @media print {{
            .no-print {{ display: none !important; }}
            body {{ padding: 0; }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #86efac; padding: 12px 18px; border-radius: 8px;">
        <span style="color: #166534; font-weight: 600; font-size: 14px;">💡 TIP: Save this offline as a PDF or Print now before network or power outages.</span>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as Offline PDF</button>
    </div>

    <div class="header">
        <div>
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #0284c7; text-transform: uppercase;">State Disaster Management Cell — Tamil Nadu</div>
            <h1 style="margin: 4px 0; font-size: 22px; color: #0f172a;">Official Evacuation &amp; Safety Action Plan</h1>
            <div style="font-size: 14px; color: #475569; font-weight: 600;">District Focus: <strong>{zname}</strong> (தமிழ்நாடு)</div>
        </div>
        <div style="text-align: right;">
            <div class="stamp">OFFLINE ADVISORY</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Issued: {data['generated_at']}</div>
        </div>
    </div>

    <h2 style="font-size: 15px; text-transform: uppercase; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 8px; margin: 16px 0 10px 0;">
        1. Designated Relief Shelters &amp; High Grounds ({zname} Zone)
    </h2>
    <table>
        <thead>
            <tr>
                <th>Priority</th>
                <th>Designated Shelter</th>
                <th>Address</th>
                <th>Capacity</th>
                <th>Distance</th>
            </tr>
        </thead>
        <tbody>
            {shelters_rows}
        </tbody>
    </table>

    <h2 style="font-size: 15px; text-transform: uppercase; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 8px; margin: 16px 0 10px 0;">
        2. Official Emergency Helpline Directory (24x7)
    </h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px;">
        {helplines_html}
    </div>

    <div class="grid">
        <div style="background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
            <h3 style="margin-top: 0; font-size: 14px; color: #0f172a;">🎒 Emergency "Go-Bag" Survival Kit</h3>
            <ul style="padding-left: 18px; margin: 0;">
                {kit_html}
            </ul>
        </div>
        <div style="background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
            <h3 style="margin-top: 0; font-size: 14px; color: #0f172a;">⚠️ Critical Do's and Don'ts</h3>
            <div style="font-weight: 700; color: #15803d; font-size: 12px; margin-bottom: 4px;">DO:</div>
            <ul style="padding-left: 18px; margin: 0 0 12px 0;">
                {dos_html}
            </ul>
            <div style="font-weight: 700; color: #b91c1c; font-size: 12px; margin-bottom: 4px;">DO NOT:</div>
            <ul style="padding-left: 18px; margin: 0;">
                {donts_html}
            </ul>
        </div>
    </div>

    <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; text-align: center; font-size: 11px; color: #64748b;">
        Official Public Safety Bulletin &bull; Tamil Nadu Disaster Intelligence &amp; Early Warning System (Eco-Shield) &bull; Keep safely accessible offline
    </div>
</body>
</html>
"""
    return html
