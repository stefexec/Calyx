from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas

router = APIRouter()

@router.post("/", response_model=schemas.EnvironmentOut)
def create_environment(environment: schemas.EnvironmentCreate, db: Session = Depends(get_db)):
    db_env = models.Environment(**environment.model_dump())
    db.add(db_env)
    db.commit()
    db.refresh(db_env)
    return db_env

@router.get("/", response_model=List[schemas.EnvironmentOut])
def read_environments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Environment).offset(skip).limit(limit).all()

@router.get("/{env_id}", response_model=schemas.EnvironmentOut)
def read_environment(env_id: str, db: Session = Depends(get_db)):
    db_env = db.query(models.Environment).filter(models.Environment.id == env_id).first()
    if db_env is None:
        raise HTTPException(status_code=404, detail="Environment not found")
    return db_env

@router.put("/{env_id}", response_model=schemas.EnvironmentOut)
def update_environment(env_id: str, environment: schemas.EnvironmentUpdate, db: Session = Depends(get_db)):
    db_env = db.query(models.Environment).filter(models.Environment.id == env_id).first()
    if db_env is None:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    update_data = environment.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_env, key, value)
        
    db.commit()
    db.refresh(db_env)
    return db_env

@router.delete("/{env_id}")
def delete_environment(env_id: str, db: Session = Depends(get_db)):
    db_env = db.query(models.Environment).filter(models.Environment.id == env_id).first()
    if db_env is None:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    db.delete(db_env)
    db.commit()
    return {"message": "Environment deleted"}
