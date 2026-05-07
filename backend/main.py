"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import init_db
from api.routes import router

app = FastAPI(title="AI Stock Signal Predictor", version="1.0.0")

# Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB tables on startup
@app.on_event("startup")
def startup():
    init_db()

app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"message": "AI Stock Signal Predictor API", "status": "running"}
