# COMPLETE FILE: backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import scans, auth

# Create tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 App starting...")
    yield
    # Shutdown
    print("✅ App shutting down...")

app = FastAPI(lifespan=lifespan)

# ✅ CORS middleware - MUST BE FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://adragportfolio.info.gf:32776", "http://adragportfolio.info.gf:32775", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(scans.router, prefix="/api/scans", tags=["scans"])

@app.get("/")
def read_root():
    return {"message": "Web Application Security Audit Platform", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
