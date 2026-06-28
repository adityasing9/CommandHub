from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn

from app.db import models, database
from app.api import schemas
from app.plugins import manager

# Create tables if they don't exist
models.Base.metadata.create_all(bind=database.engine)

# Load plugins on startup
loaded_plugins = manager.manager.discover_and_load()
print(f"Loaded plugins: {loaded_plugins}")

app = FastAPI(title="CommandHub Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "CommandHub Local API is running"}

@app.get("/api/commands", response_model=List[schemas.CommandResponse])
def get_commands(q: str = Query(None, description="Search query"), db: Session = Depends(get_db)):
    query = db.query(models.Command)
    if q:
        search = f"%{q}%"
        query = query.filter(
            models.Command.title.ilike(search) | 
            models.Command.tags.ilike(search) |
            models.Command.description.ilike(search)
        )
    
    # Get DB commands
    db_commands = query.all()
    
    # Get Plugin commands
    plugin_commands = manager.manager.get_plugin_commands()
    
    # Convert plugin commands to schema format dynamically
    plugin_cmd_objs = []
    for idx, pc in enumerate(plugin_commands):
        pc_obj = schemas.CommandResponse(
            id=9000 + idx, # Virtual ID for plugin commands
            title=pc.get("title", "Plugin Command"),
            description=pc.get("description", ""),
            syntax=pc.get("syntax", ""),
            tags=pc.get("tags", ""),
            risk_level=pc.get("risk_level", "yellow"),
            created_at=models.datetime.datetime.utcnow(),
            updated_at=models.datetime.datetime.utcnow(),
            category=schemas.CategoryResponse(id=999, name="Plugins", icon="🧩")
        )
        plugin_cmd_objs.append(pc_obj)
        
    return db_commands + plugin_cmd_objs

@app.get("/api/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

# Seed database route for testing
@app.post("/api/seed")
def seed_database(db: Session = Depends(get_db)):
    if db.query(models.Category).first():
        return {"message": "Database already seeded"}
    
    # Create Categories
    windows = models.Category(name="Windows", icon="❖")
    network = models.Category(name="Network", icon="🌐")
    git = models.Category(name="Git", icon="📦")
    
    db.add_all([windows, network, git])
    db.commit()
    
    # Create Commands
    c1 = models.Command(
        title="Flush DNS",
        description="Clears the DNS resolver cache.",
        category_id=network.id,
        tags="dns,flush,internet,network",
        syntax="ipconfig /flushdns",
        risk_level="green"
    )
    c2 = models.Command(
        title="Restart Explorer",
        description="Restarts the Windows Explorer process.",
        category_id=windows.id,
        tags="explorer,restart,freeze,windows",
        syntax="taskkill /f /im explorer.exe && start explorer.exe",
        risk_level="yellow"
    )
    db.add_all([c1, c2])
    db.commit()
    return {"message": "Database seeded successfully"}

from app.core import ai

@app.post("/api/ai/explain", response_model=schemas.AIExplainResponseSchema)
def explain_command_endpoint(request: schemas.AIExplainRequest):
    result = ai.explain_command(request.command_syntax)
    return result

@app.get("/api/ai/search", response_model=List[schemas.CommandResponse])
def search_commands_ai(q: str = Query(..., description="Natural language query"), db: Session = Depends(get_db)):
    commands = db.query(models.Command).all()
    available = [{"id": c.id, "title": c.title, "description": c.description} for c in commands]
    
    matched_ids = ai.natural_language_search(q, available)
    
    if matched_ids:
        # Extract the list of ids (some LLMs might return a dict like {"ids": [1,2]} or a flat list)
        if isinstance(matched_ids, dict):
            matched_ids = list(matched_ids.values())[0]
            
        return db.query(models.Command).filter(models.Command.id.in_(matched_ids)).all()
    return []

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

