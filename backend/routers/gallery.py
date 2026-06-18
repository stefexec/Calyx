import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas

router = APIRouter()

# The volume path mounted in docker
UPLOAD_DIR = "/app/uploads"

@router.post("/upload", response_model=schemas.GalleryImageOut)
def upload_image(
    plant_id: str = Form(...),
    days_since_germination: int = Form(None),
    phase: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check if plant exists
    db_plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if db_plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Generate a unique filename using db models generation
    file_id = models.generate_uuid()
    _, ext = os.path.splitext(file.filename)
    filename = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save to DB
    # The relative URL path for the frontend
    url_path = f"/uploads/{filename}"
    
    db_image = models.GalleryImage(
        plant_id=plant_id,
        days_since_germination=days_since_germination,
        phase=phase,
        file_path=url_path
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    
    return db_image

@router.get("/", response_model=List[schemas.GalleryImageOut])
def read_gallery(plant_id: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.GalleryImage)
    if plant_id:
        query = query.filter(models.GalleryImage.plant_id == plant_id)
    return query.order_by(models.GalleryImage.timestamp.desc()).offset(skip).limit(limit).all()

@router.delete("/{image_id}")
def delete_image(image_id: str, db: Session = Depends(get_db)):
    db_image = db.query(models.GalleryImage).filter(models.GalleryImage.id == image_id).first()
    if db_image is None:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete from DB
    db.delete(db_image)
    db.commit()
    
    # Delete file from disk
    # Extract filename from file_path e.g. /uploads/uuid.jpg
    filename = os.path.basename(db_image.file_path)
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    return {"message": "Image deleted"}
