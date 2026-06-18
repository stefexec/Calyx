from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas

router = APIRouter()

@router.post("/", response_model=schemas.GrowLogOut)
def create_log(log: schemas.GrowLogCreate, db: Session = Depends(get_db)):
    db_log = models.GrowLog(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/plant/{plant_id}", response_model=List[schemas.GrowLogOut])
def read_logs_for_plant(plant_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.GrowLog).filter(models.GrowLog.plant_id == plant_id).order_by(models.GrowLog.timestamp.desc()).offset(skip).limit(limit).all()

@router.get("/{log_id}", response_model=schemas.GrowLogOut)
def read_log(log_id: str, db: Session = Depends(get_db)):
    db_log = db.query(models.GrowLog).filter(models.GrowLog.id == log_id).first()
    if db_log is None:
        raise HTTPException(status_code=404, detail="Log not found")
    return db_log

@router.delete("/{log_id}")
def delete_log(log_id: str, db: Session = Depends(get_db)):
    db_log = db.query(models.GrowLog).filter(models.GrowLog.id == log_id).first()
    if db_log is None:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(db_log)
    db.commit()
    return {"message": "Log deleted"}
