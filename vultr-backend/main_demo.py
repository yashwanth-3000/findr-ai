from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from datetime import datetime
import os

# Create FastAPI instance
app = FastAPI(
    title="Vultr FastAPI Demo",
    description="A simple FastAPI application deployed on Vultr",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    message: str

class ItemCreate(BaseModel):
    name: str
    description: str
    price: float

class Item(BaseModel):
    id: int
    name: str
    description: str
    price: float
    created_at: str

# In-memory storage (use a real database in production)
items_db = []
item_counter = 0

@app.get("/")
async def root():
    """Root endpoint - basic hello world"""
    return {
        "message": "Hello from Vultr FastAPI Demo!",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for load balancer monitoring"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        message="FastAPI server is running on Vultr"
    )

@app.get("/info")
async def server_info():
    """Get server information"""
    return {
        "server": "Vultr Cloud Instance",
        "python_version": "3.11",
        "fastapi_framework": "FastAPI",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/items", response_model=Item)
async def create_item(item: ItemCreate):
    """Create a new item"""
    global item_counter
    item_counter += 1
    
    new_item = Item(
        id=item_counter,
        name=item.name,
        description=item.description,
        price=item.price,
        created_at=datetime.now().isoformat()
    )
    
    items_db.append(new_item)
    return new_item

@app.get("/items")
async def get_items():
    """Get all items"""
    return {
        "items": items_db,
        "total": len(items_db)
    }

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Get a specific item by ID"""
    for item in items_db:
        if item.id == item_id:
            return item
    
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/items/{item_id}")
async def delete_item(item_id: int):
    """Delete an item by ID"""
    global items_db
    
    for i, item in enumerate(items_db):
        if item.id == item_id:
            deleted_item = items_db.pop(i)
            return {"message": f"Item {item_id} deleted successfully", "deleted_item": deleted_item}
    
    raise HTTPException(status_code=404, detail="Item not found")

# For local development
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 