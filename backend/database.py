"""
database.py
SQLite persistence layer for the Disaster Intelligence Platform.
Handles sensor readings, prediction history, alerts, and shelter/resource data.
"""

import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "disaster_intel.db")


def init_db():
    """Create all tables if they do not already exist, and seed shelter data."""
    with get_conn() as conn:
        cur = conn.cursor()

        cur.execute("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_id TEXT NOT NULL,
            rainfall_mm REAL,
            water_level_m REAL,
            wind_speed_kmh REAL,
            seismic_magnitude REAL,
            soil_saturation REAL,
            timestamp TEXT DEFAULT (datetime('now'))
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_id TEXT NOT NULL,
            disaster_type TEXT NOT NULL,
            risk_score REAL NOT NULL,
            risk_category TEXT NOT NULL,
            confidence REAL NOT NULL,
            contributing_factors TEXT,
            timestamp TEXT DEFAULT (datetime('now'))
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_id TEXT NOT NULL,
            disaster_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            channels TEXT NOT NULL,
            population_affected INTEGER,
            status TEXT DEFAULT 'DISPATCHED',
            timestamp TEXT DEFAULT (datetime('now'))
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS shelters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            capacity INTEGER,
            current_occupancy INTEGER DEFAULT 0,
            status TEXT DEFAULT 'AVAILABLE'
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS zones (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            population INTEGER
        )
        """)

        conn.commit()

        cur.execute("SELECT COUNT(*) FROM zones")
        zone_count = cur.fetchone()[0]
        if zone_count < 15:
            # Re-seed with full Tamil Nadu statewide coverage
            cur.execute("DELETE FROM zones")
            cur.execute("DELETE FROM shelters")
            _seed_data(cur)
            conn.commit()


def _seed_data(cur):
    """Seed comprehensive statewide disaster zones and relief shelters across Tamil Nadu."""
    zones = [
        ("TN-CHE-1", "Chennai Central & Basin", 13.0827, 80.2707, 710000),
        ("TN-CHE-2", "Chennai South & Velachery", 12.9790, 80.2210, 480000),
        ("TN-NIL", "Nilgiris (Ooty & Coonoor)", 11.4102, 76.6950, 735000),
        ("TN-CUD", "Cuddalore Coastal Belt", 11.7480, 79.7714, 2600000),
        ("TN-NAG", "Nagapattinam Coast & Delta", 10.7672, 79.8449, 1610000),
        ("TN-KAN", "Kanyakumari Southern Cape", 8.0883, 77.5385, 1870000),
        ("TN-THO", "Thoothukudi Port & Lowlands", 8.7642, 78.1348, 1750000),
        ("TN-RAM", "Ramanathapuram & Rameswaram", 9.3639, 78.8395, 1350000),
        ("TN-THA", "Thanjavur Cauvery Delta", 10.7870, 79.1378, 2400000),
        ("TN-TRU", "Tiruvarur Lowlands", 10.7725, 79.6366, 1260000),
        ("TN-MDU", "Madurai Vaigai River Basin", 9.9252, 78.1198, 3038000),
        ("TN-TRI", "Tiruchirappalli (Trichy) Basin", 10.7905, 78.7047, 2722000),
        ("TN-TNV", "Tirunelveli Thamirabarani Basin", 8.7139, 77.7567, 1665000),
        ("TN-CBE", "Coimbatore & Siruvani Belt", 11.0168, 76.9558, 3458000),
        ("TN-DIN", "Dindigul & Kodaikanal Hills", 10.3673, 77.9803, 2159000),
        ("TN-SAL", "Salem & Yercaud Foothills", 11.6643, 78.1460, 3482000),
        ("TN-VEL", "Vellore Palar River Basin", 12.9165, 79.1325, 1614000),
        ("TN-KCP", "Kanchipuram & Chengalpattu Lakes", 12.8342, 79.7036, 2550000),
    ]
    cur.executemany(
        "INSERT INTO zones (id, name, latitude, longitude, population) VALUES (?, ?, ?, ?, ?)",
        zones,
    )

    shelters = [
        # Chennai
        ("Chennai Central Emergency Camp", "MEDICAL", 13.0827, 80.2707, 450),
        ("Velachery Govt Relief Hall", "SHELTER", 12.9750, 80.2180, 500),
        ("Adyar SDRF Rescue Post", "RESCUE_UNIT", 13.0100, 80.2500, 120),
        # Nilgiris
        ("Ooty High School Relief Camp", "SHELTER", 11.4120, 76.6980, 350),
        ("Coonoor Hill Rescue & Medical Post", "MEDICAL", 11.3530, 76.7959, 180),
        # Cuddalore
        ("Cuddalore Port Cyclone Center", "SHELTER", 11.7510, 79.7740, 800),
        ("Chidambaram Emergency Medical Unit", "MEDICAL", 11.3990, 79.6936, 250),
        ("Cuddalore NDRF Quick Response Post", "RESCUE_UNIT", 11.7450, 79.7680, 100),
        # Nagapattinam
        ("Nagapattinam Multi-purpose Cyclone Shelter", "SHELTER", 10.7650, 79.8420, 950),
        ("Velankanni Disaster First Aid Post", "MEDICAL", 10.6800, 79.8490, 200),
        # Kanyakumari
        ("Kanyakumari Marine Rescue Shelter", "SHELTER", 8.0890, 77.5410, 600),
        ("Nagercoil Medical Emergency Unit", "MEDICAL", 8.1833, 77.4119, 300),
        # Thoothukudi
        ("Thoothukudi Harbour Relief Center", "SHELTER", 8.7620, 78.1360, 700),
        ("Thoothukudi SDRF Inundation Rescue Base", "RESCUE_UNIT", 8.7600, 78.1300, 90),
        # Ramanathapuram
        ("Rameswaram Coastal Shelter", "SHELTER", 9.2876, 79.3129, 650),
        ("Ramanathapuram Govt Medical Center", "MEDICAL", 9.3650, 78.8350, 220),
        # Thanjavur & Tiruvarur
        ("Thanjavur Delta Flood Relief Shelter", "SHELTER", 10.7850, 79.1350, 550),
        ("Tiruvarur Agricultural College Camp", "SHELTER", 10.7710, 79.6320, 480),
        # Madurai
        ("Madurai Vaigai Emergency Shelter", "SHELTER", 9.9280, 78.1210, 600),
        ("Madurai Govt Rajaji Medical Depot", "MEDICAL", 9.9320, 78.1240, 350),
        # Trichy
        ("Tiruchirappalli Cauvery Relief Center", "SHELTER", 10.7950, 78.7020, 550),
        ("Trichy NDRF Flood Rescue Station", "RESCUE_UNIT", 10.7910, 78.7100, 110),
        # Tirunelveli
        ("Tirunelveli Riverbank Safe Shelter", "SHELTER", 8.7150, 77.7520, 500),
        ("Palayamkottai Emergency Medical Unit", "MEDICAL", 8.7200, 77.7450, 220),
        # Coimbatore & Nilgiris foothills
        ("Coimbatore VOC Park Relief Hall", "SHELTER", 11.0180, 76.9600, 700),
        ("Coimbatore Fire & Rescue Command", "RESCUE_UNIT", 11.0120, 76.9510, 150),
        # Dindigul & Kodaikanal
        ("Kodaikanal Ghat Road Emergency Shelter", "SHELTER", 10.2381, 77.4892, 400),
        ("Dindigul District Medical Center", "MEDICAL", 10.3650, 77.9780, 260),
        # Salem
        ("Salem Foothills Relief Center", "SHELTER", 11.6660, 78.1430, 520),
        # Vellore & Kanchipuram
        ("Vellore Fort Emergency Depot", "SHELTER", 12.9180, 79.1310, 450),
        ("Chengalpattu Lake Basin Relief Camp", "SHELTER", 12.6920, 79.9800, 600),
    ]
    cur.executemany(
        "INSERT INTO shelters (name, type, latitude, longitude, capacity) VALUES (?, ?, ?, ?, ?)",
        shelters,
    )


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
