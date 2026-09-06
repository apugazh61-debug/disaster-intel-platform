"""
resource_allocator.py
Computes nearest available shelters / medical units / rescue vehicles
to a given risk zone using the Haversine great-circle distance formula,
then ranks by a composite score of distance + remaining capacity.
"""

import math
from typing import List, Dict


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def rank_nearest_resources(zone_lat: float, zone_lon: float, shelters: List[Dict], top_n: int = 5) -> List[Dict]:
    """
    Rank shelters/resources by proximity to a disaster zone, penalizing
    shelters that are near full capacity so load balances across the region.
    """
    ranked = []
    for s in shelters:
        distance = haversine_km(zone_lat, zone_lon, s["latitude"], s["longitude"])
        capacity = s.get("capacity") or 1
        occupancy = s.get("current_occupancy") or 0
        free_ratio = max(1 - (occupancy / capacity), 0.05)

        # lower composite score = better choice (closer + more free space)
        composite_score = distance * (1.0 / free_ratio)

        ranked.append({
            **s,
            "distance_km": round(distance, 2),
            "free_capacity": capacity - occupancy,
            "composite_score": round(composite_score, 2),
        })

    ranked.sort(key=lambda r: r["composite_score"])
    return ranked[:top_n]
