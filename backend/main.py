from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine, Base
from routers import environments, plants, logs, tasks, gallery, nutrients, settings

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Calyx Backend", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
os.makedirs("/app/uploads", exist_ok=True)

# Mount static files for images
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

# Include routers
app.include_router(environments.router, prefix="/api/environments", tags=["environments"])
app.include_router(plants.router, prefix="/api/plants", tags=["plants"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(gallery.router, prefix="/api/gallery", tags=["gallery"])
app.include_router(nutrients.router, prefix="/api/nutrients", tags=["nutrients"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
