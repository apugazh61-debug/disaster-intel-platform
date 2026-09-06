import sqlite3
import urllib.request
import json

conn = sqlite3.connect('disaster_intel.db')
zones = conn.execute('SELECT id, name, latitude, longitude FROM zones').fetchall()
lats = ','.join(str(z[2]) for z in zones)
lons = ','.join(str(z[3]) for z in zones)
url = f'https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lons}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_gusts_10m,soil_moisture_0_to_1cm&timezone=auto'
req = urllib.request.Request(url, headers={'User-Agent': 'EcoShield-DisasterPlatform/1.0'})
res = urllib.request.urlopen(req, timeout=10)
data = json.loads(res.read())

print(f"Total zones fetched: {len(data)}")
for z, d in zip(zones, data):
    c = d.get('current', {})
    print(f"[{z[0]}] {z[1]}: Temp={c.get('temperature_2m')}°C, Rain={c.get('precipitation')}mm, Wind={c.get('wind_speed_10m')}km/h, SoilMoist={c.get('soil_moisture_0_to_1cm')}")
