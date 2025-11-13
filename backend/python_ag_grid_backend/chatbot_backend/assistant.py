import gradio as gr
from gradio import ChatMessage
from smolagents import CodeAgent, InferenceClientModel, OpenAIServerModel, stream_to_gradio, PromptTemplates
from dotenv import load_dotenv
from dataclasses import asdict
from .sql_tool import sql_engine

import os

load_dotenv()

system_prompt="""You are an intelligent Sports Analytics Assistant with access to a SQL database
containing basketball data. Your goal is to help analysts explore, summarize, and interpret the data through
natural conversation. You can answer questions about player performance, team
results, match statistics, and more. Be concise but informative in final answers"""

agent = CodeAgent(
    tools=[sql_engine],
    model=OpenAIServerModel(
        model_id="gpt-4o",
        api_base="https://api.openai.com/v1",
        api_key=os.environ["OPENAI_API_KEY"],
    ),
    instructions=system_prompt
    # stream_outputs=True
)

def interact_with_agent(prompt, history):
    messages = []
    yield messages
    for msg in stream_to_gradio(agent, prompt):
        messages.append((asdict(msg)))
        yield messages
    yield messages
        
ui = gr.ChatInterface(
    interact_with_agent,
    chatbot = gr.Chatbot(
        label="AGENT",
        type="messages",
        avatar_images=(
            None,
            "https://em-content.zobj.net/source/twitter/53/robot-face_1f916.png",
        ),
    )
)


