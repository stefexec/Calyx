from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import asyncio
import logging
import httpx

from database import engine, Base, SessionLocal
import models
from utils import send_ntfy_notification
from routers.homeassistant import get_ha_config
from routers import environments, plants, logs, tasks, gallery, nutrients, settings, homeassistant

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Calyx Backend", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
os.makedirs("/app/uploads", exist_ok=True)

# Mount static files for images
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

# Include routers
app.include_router(environments.router, prefix="/api/environments", tags=["environments"])
app.include_router(plants.router, prefix="/api/plants", tags=["plants"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(gallery.router, prefix="/api/gallery", tags=["gallery"])
app.include_router(nutrients.router, prefix="/api/nutrients", tags=["nutrients"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(homeassistant.router, prefix="/api/ha", tags=["ha"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

logger = logging.getLogger(__name__)

async def light_bleed_monitor():
    while True:
        try:
            await asyncio.sleep(300) # Check every 5 minutes
            
            db = SessionLocal()
            try:
                # 1. Check if luxThreshold is set
                threshold_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "luxThreshold").first()
                if not threshold_setting:
                    continue
                lux_threshold = int(threshold_setting.value)
                
                # 2. Get HA config
                try:
                    ha_url, ha_token = get_ha_config(db)
                except Exception:
                    continue # Not configured
                
                headers = {"Authorization": f"Bearer {ha_token}", "Content-Type": "application/json"}
                
                # 3. Check all environments
                envs = db.query(models.Environment).all()
                for env in envs:
                    if not env.ha_entity_ids or len(env.ha_entity_ids) < 3:
                        continue
                    lux_sensor_id = env.ha_entity_ids[2]
                    if not lux_sensor_id:
                        continue
                        
                    plug_config = env.plug_config or {}
                    light_plug = plug_config.get("light", {})
                    light_plug_id = light_plug.get("entityId")
                    
                    if not light_plug_id:
                        continue
                        
                    # Fetch states from HA
                    async with httpx.AsyncClient() as client:
                        # Get plug state
                        plug_res = await client.get(f"{ha_url}/api/states/{light_plug_id}", headers=headers, timeout=5.0)
                        if plug_res.status_code != 200:
                            continue
                        plug_state = plug_res.json().get("state")
                        
                        if plug_state != "off":
                            continue # Only alert during dark phase
                            
                        # Get lux state
                        lux_res = await client.get(f"{ha_url}/api/states/{lux_sensor_id}", headers=headers, timeout=5.0)
                        if lux_res.status_code != 200:
                            continue
                            
                        lux_state_str = lux_res.json().get("state", "0")
                        try:
                            lux_val = float(lux_state_str)
                        except ValueError:
                            continue
                            
                        if lux_val > lux_threshold:
                            # TRIGGER ALERT!
                            alert_title = f"🚨 Light Bleed Detected!"
                            alert_msg = f"The lux sensor in '{env.name}' reading is {lux_val} lx (Threshold: {lux_threshold}) while the lights are OFF!"
                            await send_ntfy_notification(alert_title, alert_msg, "high", db)
                            
            except Exception as e:
                logger.error(f"Error in light bleed monitor loop: {e}")
            finally:
                db.close()
                
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Unexpected error in light bleed monitor: {e}")
            await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(light_bleed_monitor())
