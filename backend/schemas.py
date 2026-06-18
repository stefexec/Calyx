from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- Environment ---
class EnvironmentBase(BaseModel):
    name: str
    medium: Optional[str] = None
    light_cycle: Optional[str] = None
    ha_entity_ids: Optional[Any] = None
    plug_config: Optional[Any] = None

class EnvironmentCreate(EnvironmentBase):
    pass

class EnvironmentUpdate(EnvironmentBase):
    name: Optional[str] = None

class EnvironmentOut(EnvironmentBase):
    id: str

    class Config:
        from_attributes = True

# --- Plant ---
class PlantBase(BaseModel):
    environment_id: str
    name: str
    strain: Optional[str] = None
    type: Optional[str] = None
    current_phase: Optional[str] = None
    date_germinated: Optional[datetime] = None
    date_flipped: Optional[datetime] = None
    has_soil_moisture_sensor: bool = False

class PlantCreate(PlantBase):
    pass

class PlantUpdate(PlantBase):
    environment_id: Optional[str] = None
    name: Optional[str] = None

class PlantOut(PlantBase):
    id: str

    class Config:
        from_attributes = True

# --- GrowLog ---
class GrowLogBase(BaseModel):
    plant_id: str
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)
    water_amount: Optional[float] = None
    ec: Optional[float] = None
    ph: Optional[float] = None
    recipe_id: Optional[str] = None
    recipe_scale: Optional[int] = None
    notes: Optional[str] = None

class GrowLogCreate(GrowLogBase):
    pass

class GrowLogOut(GrowLogBase):
    id: str

    class Config:
        from_attributes = True

# --- GalleryImage ---
class GalleryImageBase(BaseModel):
    plant_id: str
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)
    days_since_germination: Optional[int] = None
    phase: Optional[str] = None
    file_path: str

class GalleryImageCreate(GalleryImageBase):
    pass

class GalleryImageOut(GalleryImageBase):
    id: str

    class Config:
        from_attributes = True

# --- Task ---
class TaskBase(BaseModel):
    date: Optional[datetime] = Field(default_factory=datetime.utcnow)
    plant_id: Optional[str] = None
    category: str
    description: str
    is_completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    category: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None

class TaskOut(TaskBase):
    id: str

    class Config:
        from_attributes = True

# --- Nutrients ---
class NutrientProductBase(BaseModel):
    brand: str
    name: str

class NutrientProductCreate(NutrientProductBase):
    pass

class NutrientProductOut(NutrientProductBase):
    id: str

    class Config:
        from_attributes = True

class NutrientRecipeBase(BaseModel):
    name: str
    ingredients: Any

class NutrientRecipeCreate(NutrientRecipeBase):
    pass

class NutrientRecipeOut(NutrientRecipeBase):
    id: str

    class Config:
        from_attributes = True

# --- Settings ---
class AppSettingBase(BaseModel):
    key: str
    value: str

class AppSettingCreate(AppSettingBase):
    pass

class AppSettingOut(AppSettingBase):
    class Config:
        from_attributes = True
