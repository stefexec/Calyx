from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas

router = APIRouter()

@router.post("/products", response_model=schemas.NutrientProductOut)
def create_product(product: schemas.NutrientProductCreate, db: Session = Depends(get_db)):
    db_prod = models.NutrientProduct(**product.model_dump())
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return db_prod

@router.get("/products", response_model=List[schemas.NutrientProductOut])
def read_products(db: Session = Depends(get_db)):
    return db.query(models.NutrientProduct).all()

@router.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    db_prod = db.query(models.NutrientProduct).filter(models.NutrientProduct.id == product_id).first()
    if db_prod is None:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_prod)
    db.commit()
    return {"message": "Product deleted"}

@router.post("/recipes", response_model=schemas.NutrientRecipeOut)
def create_recipe(recipe: schemas.NutrientRecipeCreate, db: Session = Depends(get_db)):
    db_rec = models.NutrientRecipe(**recipe.model_dump())
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)
    return db_rec

@router.get("/recipes", response_model=List[schemas.NutrientRecipeOut])
def read_recipes(db: Session = Depends(get_db)):
    return db.query(models.NutrientRecipe).all()

@router.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: str, db: Session = Depends(get_db)):
    db_rec = db.query(models.NutrientRecipe).filter(models.NutrientRecipe.id == recipe_id).first()
    if db_rec is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(db_rec)
    db.commit()
    return {"message": "Recipe deleted"}
