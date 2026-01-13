from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZIPMiddleware
from routers import tables, upload, login, teams
from python_ag_grid_backend.database import init_db
import gradio as gr 
from chatbot_backend import assistant

# Set max request body size to 100 MB
app = FastAPI(max_size=100_000_000)  # 100 MB in bytes

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add gzip compression for large responses
app.add_middleware(GZIPMiddleware, minimum_size=1000)

@app.on_event("startup")
def startup_event():
    """Initialize database tables on app startup."""
    init_db()

app.include_router(tables.router, prefix="/api/table", tags=["tables"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(login.router, prefix="/api/login", tags=["login"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app = gr.mount_gradio_app(app, assistant.ui, path="/ai-assistant", show_api=False)
