# backend/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from python_ag_grid_backend.routers import tables, upload, login, assistant
# import gradio as gr
# from python_ag_grid_backend.chatbot_backend import assistant
from python_ag_grid_backend.chatbot_backend.langchain_assistant import init_agent, create_ui
from metabase_embed import router as metabase_router
from contextlib import asynccontextmanager


load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent, memory, subapp_gradio
    
    print("🚀 Starting app...")

    try:
        async with init_agent() as (agent, memory):
            app.state.agent = agent
            app.state.agent_mem = memory
            
             # ✅ sanity check
            if agent is None:
                print("⚠️ Agent is None — initialization failed.")
            else:
                print(f"✅ Agent initialized: {type(agent)}")

            if memory is None:
                print("⚠️ Memory saver not initialized.")
            else:
                print(f"✅ Memory saver initialized: {type(memory)}")
            
            # subapp_gradio = create_ui(app.state.agent, thread_id="mem_test")
            # print(subapp_gradio)
            # gr.mount_gradio_app(app, subapp_gradio, path="/ai-assistant", show_api=False)
            
            # subapp_gradio.launch()
        
            yield
    except Exception as e:
        print("🔥 Error during startup:", repr(e))
        raise
    

app = FastAPI(lifespan=lifespan)
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
# app = gr.mount_gradio_app(app, assistant.ui, path="/ai-assistant", show_api=False)
app.include_router(assistant.router, prefix="/api/chat", tags=["asisstant"])


