import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID # In case of PG migration later, but for SQLite we usually use String
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Environment(Base):
    __tablename__ = "environments"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, index=True)
    medium = Column(String)
    light_cycle = Column(String, nullable=True)
    ha_entity_ids = Column(JSON, nullable=True)
    plug_config = Column(JSON, nullable=True)

class Plant(Base):
    __tablename__ = "plants"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    environment_id = Column(String, ForeignKey("environments.id"))
    name = Column(String, index=True)
    strain = Column(String)
    type = Column(String)  # Auto or Fem
    current_phase = Column(String)
    date_germinated = Column(DateTime, nullable=True)
    date_flipped = Column(DateTime, nullable=True)
    has_soil_moisture_sensor = Column(Boolean, default=False)

class GrowLog(Base):
    __tablename__ = "grow_logs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    plant_id = Column(String, ForeignKey("plants.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    water_amount = Column(Float, nullable=True)
    ec = Column(Float, nullable=True)
    ph = Column(Float, nullable=True)
    recipe_id = Column(String, nullable=True)
    recipe_scale = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)

class GalleryImage(Base):
    __tablename__ = "gallery_images"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    plant_id = Column(String, ForeignKey("plants.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    days_since_germination = Column(Integer, nullable=True)
    phase = Column(String, nullable=True)
    file_path = Column(String)  # e.g., /uploads/img_123.jpg

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    plant_id = Column(String, ForeignKey("plants.id"), nullable=True)
    category = Column(String)
    description = Column(String)
    is_completed = Column(Boolean, default=False)

class NutrientProduct(Base):
    __tablename__ = "nutrient_products"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    brand = Column(String)
    name = Column(String)

class NutrientRecipe(Base):
    __tablename__ = "nutrient_recipes"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String)
    ingredients = Column(JSON)  # List of {productId, mlPerLiter}

class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)
