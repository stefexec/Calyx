from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import secrets

from database import get_db
import models
from auth import get_api_key

router = APIRouter()

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key: str # Usually we only show a preview or full key once. We will send full key since it's a simple homelab setup.
    created_at: str

    class Config:
        orm_mode = True

class ApiKeyCreate(BaseModel):
    name: str

@router.get("/", response_model=List[ApiKeyResponse])
def get_api_keys(db: Session = Depends(get_db), current_key: models.ApiKey = Depends(get_api_key)):
    keys = db.query(models.ApiKey).all()
    # Format created_at to string
    return [{"id": k.id, "name": k.name, "key": k.key, "created_at": k.created_at.isoformat()} for k in keys]

@router.post("/", response_model=ApiKeyResponse)
def create_api_key(api_key: ApiKeyCreate, db: Session = Depends(get_db), current_key: models.ApiKey = Depends(get_api_key)):
    new_token = "calyx_" + secrets.token_urlsafe(32)
    db_key = models.ApiKey(name=api_key.name, key=new_token)
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    return {"id": db_key.id, "name": db_key.name, "key": db_key.key, "created_at": db_key.created_at.isoformat()}

@router.delete("/{key_id}")
def delete_api_key(key_id: str, db: Session = Depends(get_db), current_key: models.ApiKey = Depends(get_api_key)):
    db_key = db.query(models.ApiKey).filter(models.ApiKey.id == key_id).first()
    if not db_key:
        raise HTTPException(status_code=404, detail="API Key not found")
    
    # Check if deleting the last key
    key_count = db.query(models.ApiKey).count()
    if key_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last API key")
        
    db.delete(db_key)
    db.commit()
    return {"status": "success"}
