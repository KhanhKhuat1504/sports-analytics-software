# backend/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from python_ag_grid_backend.routers import tables, upload, login, teams
import gradio as gr
from python_ag_grid_backend.chatbot_backend import assistant
from metabase_embed import router as metabase_router

load_dotenv()

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


app.include_router(metabase_router)
app.include_router(tables.router, prefix="/api/table", tags=["tables"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(login.router, prefix="/api/login", tags=["login"])
app.include_router(teams.router, prefix="/api/teams")
app = gr.mount_gradio_app(app, assistant.ui, path="/ai-assistant", show_api=False)
