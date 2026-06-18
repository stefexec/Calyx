from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas

router = APIRouter()

@router.post("/", response_model=schemas.PlantOut)
def create_plant(plant: schemas.PlantCreate, db: Session = Depends(get_db)):
    db_plant = models.Plant(**plant.model_dump())
    db.add(db_plant)
    db.commit()
    db.refresh(db_plant)
    return db_plant

@router.get("/", response_model=List[schemas.PlantOut])
def read_plants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Plant).offset(skip).limit(limit).all()

@router.get("/{plant_id}", response_model=schemas.PlantOut)
def read_plant(plant_id: str, db: Session = Depends(get_db)):
    db_plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if db_plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return db_plant

@router.put("/{plant_id}", response_model=schemas.PlantOut)
def update_plant(plant_id: str, plant: schemas.PlantUpdate, db: Session = Depends(get_db)):
    db_plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if db_plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    update_data = plant.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plant, key, value)
        
    db.commit()
    db.refresh(db_plant)
    return db_plant

@router.delete("/{plant_id}")
def delete_plant(plant_id: str, db: Session = Depends(get_db)):
    db_plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if db_plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    db.delete(db_plant)
    db.commit()
    return {"message": "Plant deleted"}
