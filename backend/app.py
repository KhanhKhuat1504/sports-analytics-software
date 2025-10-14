# backend/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv  # <-- add

load_dotenv()  # <-- loads backend/.env at startup
from metabase_embed import router as metabase_router

# from superset_embed import router as superset_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz():
    return {"ok": True}


# app.include_router(superset_router)
app.include_router(metabase_router)
