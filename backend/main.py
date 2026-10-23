from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Gridbricks Backend is running successfully!"}

@app.get("/api/wind-data")
def get_wind_data():
    try:
        actual_url = "https://bmrs.elexon.co.uk/api/public/datasets/FUELHH/stream?fuelType=WIND"
        response = requests.get(actual_url, timeout=4)
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list) and len(data) > 0 and "forecast" in data[0]:
                    return {"status": "success", "source": "live", "count": len(data[:50]), "data": data[:50]}
            except:
                pass
                
        sample_data = [
            {"startTime": "2026-01-01T00:00:00Z", "generation": 12500, "forecast": 12000},
            {"startTime": "2026-01-01T00:30:00Z", "generation": 12800, "forecast": 12400},
            {"startTime": "2026-01-01T01:00:00Z", "generation": 13100, "forecast": 13000},
            {"startTime": "2026-01-01T01:30:00Z", "generation": 11900, "forecast": 12200},
            {"startTime": "2026-01-01T02:00:00Z", "generation": 11500, "forecast": 11800},
            {"startTime": "2026-01-01T02:30:00Z", "generation": 13450, "forecast": 12900},
            {"startTime": "2026-01-01T03:00:00Z", "generation": 14200, "forecast": 13800},
            {"startTime": "2026-01-01T03:30:00Z", "generation": 13900, "forecast": 14100},
        ]
        return {"status": "success", "source": "sample", "count": len(sample_data), "data": sample_data}
        
    except Exception:
        return {
            "status": "success", 
            "source": "fallback", 
            "data": [{"startTime": "2026-01-01T00:00:00Z", "generation": 12500, "forecast": 12000}]
        }