# Eco-Shield: AI Disaster Intelligence & Response Platform

An intelligent statewide disaster monitoring, risk prediction, and emergency response platform tailored for **Tamil Nadu**. Features a high-performance **FastAPI backend** connected with real-time **Open-Meteo satellite observations**, automated crisis prediction, resource allocation, and a cyber-command center frontend built with **React 18 & Tailwind CSS**.

---

## 🌟 Key Features

- **Statewide Tamil Nadu Coverage**: Monitors 18 high-risk districts (Nilgiris, Cuddalore, Chennai, Madurai, Kanyakumari, etc.) and tracks 31 emergency relief shelters & medical posts.
- **Esri Satellite Multi-Layer Map**: Real-time colorful satellite imagery (*Esri World Imagery*), Dark Command Center view, and OpenStreetMap street layers.
- **Real-Time Satellite Weather Telemetry**: Ingests live telemetry (Temperature, Rainfall mm, Wind Speed, Humidity, Soil Saturation, River Water Levels) directly via Open-Meteo models.
- **Instant District Search**: Dynamic autocomplete search bar with smooth `flyTo` camera transitions and interactive hazard diagnosis cards.
- **Explainable Multi-Hazard Prediction Engine**: Calculates multi-factor risk scores (0-100) for Flood, Landslide, and Cyclone hazards with contributing factor breakdowns.
- **Automated Resource Allocation**: Ranks nearest shelters, medical camps, and rescue units based on Haversine distance and capacity.
- **Live WebSocket Alert Broadcasts**: Real-time event streaming (`/ws/live`) with emergency dispatches across SMS, Sirens, Push Notifications, and VHF channels.
- **Crisis Simulation Drill**: One-click "⚡ Trigger Crisis Spike" mode to stress-test response capabilities and simulate localized emergency scenarios.

---

## 🏗️ Architecture

```
disaster-intel-platform/
├── backend/
│   ├── main.py                  # FastAPI server, WebSocket hub, background sensor loops
│   ├── database.py              # SQLite persistence layer & statewide Tamil Nadu seed data
│   ├── prediction_engine.py      # Multi-hazard risk scoring algorithms
│   ├── resource_allocator.py     # Emergency shelter & rescue ranking (Haversine)
│   ├── weather_service.py       # Live Open-Meteo satellite weather ingestion
│   └── requirements.txt         # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Main dashboard layout and WebSocket state manager
    │   ├── components/
    │   │   ├── Header.jsx       # Command navbar, search autocomplete, sync & mode toggles
    │   │   ├── MapView.jsx      # Esri Leaflet map, dynamic circle markers, shelter pins
    │   │   ├── OverviewStats.jsx# Monitored zones, total alerts, critical alerts, shelters
    │   │   ├── DistrictList.jsx # Live risk-ranked district cards with weather snippets
    │   │   └── AlertFeed.jsx    # Real-time alert broadcasts with dispatched resources
    │   └── utils/
    │       └── popupBuilder.js  # Interactive diagnosis popup generator
    ├── tailwind.config.js       # Custom Cyber Command Center dark theme
    ├── vite.config.js           # Vite build pipeline with dev proxy
    └── package.json             # React 18, Tailwind CSS v3, Lucide icons, Leaflet
```

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup (Development & Build)
```bash
cd frontend
npm install
npm run build      # Compiles production bundle to frontend/dist
# Or for live development:
npm run dev        # Starts Vite dev server on http://localhost:5173
```

Open **`http://localhost:8000`** in your browser to view the live dashboard!
FastAPI automatically serves the compiled React + Tailwind production build directly from `frontend/dist`.

---

## 📡 API Documentation

Visit **`http://localhost:8000/docs`** to explore the interactive Swagger UI:
- `GET /api/zones`: List of all 18 statewide Tamil Nadu zones.
- `GET /api/shelters`: List of 31 emergency shelters and medical relief units.
- `GET /api/dashboard/summary`: Aggregate counts of monitored zones, alerts, critical events.
- `POST /api/weather/sync`: Re-sync real-time satellite weather from Open-Meteo.
- `POST /api/simulate/disaster/{zone_id}`: Trigger on-demand crisis spike.
- `WS /ws/live`: Live WebSocket stream for predictions and alerts.
