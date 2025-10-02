from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import tables, upload
import gradio as gr 
from chatbot_backend import assistant

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tables.router, prefix="/api/table", tags=["tables"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app = gr.mount_gradio_app(app, assistant.ui, path="/ai-assistant", show_api=False)
