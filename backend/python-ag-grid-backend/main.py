from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import tables

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tables.router, prefix="/api/table", tags=["tables"])