from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas

router = APIRouter()

@router.put("/{key}", response_model=schemas.AppSettingOut)
def set_setting(key: str, setting: schemas.AppSettingCreate, db: Session = Depends(get_db)):
    if key != setting.key:
        raise HTTPException(status_code=400, detail="Key mismatch")
        
    db_setting = db.query(models.AppSetting).filter(models.AppSetting.key == key).first()
    if db_setting:
        db_setting.value = setting.value
    else:
        db_setting = models.AppSetting(key=setting.key, value=setting.value)
        db.add(db_setting)
        
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.get("/", response_model=List[schemas.AppSettingOut])
def get_all_settings(db: Session = Depends(get_db)):
    return db.query(models.AppSetting).all()
