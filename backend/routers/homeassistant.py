from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import httpx
from datetime import datetime, timedelta

from pydantic import BaseModel
from database import get_db
import models

router = APIRouter()

class ServiceCall(BaseModel):
    entity_id: str

def get_ha_config(db: Session):
    ha_url_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "haUrl").first()
    ha_token_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "haToken").first()
    
    url = ha_url_setting.value if ha_url_setting else None
    token = ha_token_setting.value if ha_token_setting else None
    
    if not url or not token:
        raise HTTPException(status_code=400, detail="Home Assistant URL or Token is not configured.")
        
    # Ensure url doesn't end with a slash
    if url.endswith('/'):
        url = url[:-1]
        
    return url, token

@router.get("/test")
async def test_connection(db: Session = Depends(get_db)):
    url, token = get_ha_config(db)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{url}/api/", headers=headers, timeout=5.0)
            if response.status_code == 200:
                return {"status": "success", "message": "Connection to Home Assistant successful."}
            else:
                raise HTTPException(status_code=response.status_code, detail=f"Home Assistant returned status {response.status_code}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to Home Assistant: {str(e)}")

@router.get("/states/{entity_id}")
async def get_state(entity_id: str, db: Session = Depends(get_db)):
    url, token = get_ha_config(db)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{url}/api/states/{entity_id}", headers=headers, timeout=5.0)
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch state")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{entity_id}")
async def get_history(entity_id: str, db: Session = Depends(get_db)):
    url, token = get_ha_config(db)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Get last 24 hours
    start_time = (datetime.utcnow() - timedelta(days=1)).isoformat() + "Z"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{url}/api/history/period/{start_time}?filter_entity_id={entity_id}&minimal_response", 
                headers=headers, 
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch history")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/services/{domain}/{service}")
async def call_service(domain: str, service: str, payload: ServiceCall, db: Session = Depends(get_db)):
    url, token = get_ha_config(db)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    ha_payload = {"entity_id": payload.entity_id}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{url}/api/services/{domain}/{service}", json=ha_payload, headers=headers, timeout=5.0)
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to call service")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
