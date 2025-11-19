# from langgraph.prebuilt import create_react_agent
from langchain.agents import create_agent
from langchain.agents.middleware import (
    ContextEditingMiddleware,
    ClearToolUsesEdit,
    SummarizationMiddleware,
)
from langchain_openai import ChatOpenAI

# from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

# from langchain_core.messages import SystemMessage
from langchain_core.messages.utils import trim_messages, count_tokens_approximately
import gradio as gr
from gradio import ChatMessage
from python_ag_grid_backend.chatbot_backend.sql_tool import lc_sql_engine

# from .sql_tool import lc_sql_engine
from dotenv import load_dotenv
import os
from functools import partial
from contextlib import asynccontextmanager
import pprint
from typing import TypedDict
from langchain.agents.middleware import dynamic_prompt, ModelRequest

load_dotenv()


class teamContext(TypedDict):
    tablesDescription: str


model = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
    streaming=True,
    # , output_version="v0"
)


# memory trimming pre-model-hook
# This function will be called every time before the node that calls LLM
def pre_model_hook(state):
    trimmed_messages = trim_messages(
        state["messages"],
        strategy="last",
        token_counter=count_tokens_approximately,
        max_tokens=2000,
        start_on="human",
        end_on=("human", "tool"),
    )
    return {"llm_input_messages": trimmed_messages}


prompt = """You are an intelligent Sports Analytics Assistant with access to a SQL database containing basketball data. Your goal is to help analysts explore, summarize, and interpret the data through natural conversation. You can answer questions about player performance, team results, match statistics, and more. Be concise but informative in final answers"""


@dynamic_prompt
def schema_scoped_prompt(request: ModelRequest) -> str:
    """Generate system prompt based on the team that is being selected, indicated by NavBar"""

    base_prompt = """You are an intelligent Sports Analytics Assistant with access to a SQL database containing basketball data. Your goal is to help analysts explore, summarize, and interpret the data through natural conversation. You can answer questions about player performance, team results, match statistics, and more. Be concise but informative in final answers"""

    tables_description = request.runtime.context.get("tablesDescription")

    schema_aware_prompt = f"""
        You are querying from this schema.  
        {tables_description}
        Always use fully qualified table names: schema_name.table_name
    """

    return base_prompt + schema_aware_prompt


# Create a simple ReAct Agent. The agent alternates between `agent` and `tool` node. The execution flow simply stops when the LLM output doesn't include a `tool_calls` attribute, meaning it decides no other tool needs to / has to be called.

# memory = PostgresSaver.from_conn_string(os.getenv("DB_URL").replace("+psycopg2", ""))
conn_info = os.getenv("DB_URL").replace("+psycopg2", "")
# pool =  AsyncConnectionPool(
#     conninfo=conn_info,
#     max_size=10
# )

# Print the agent's diagram
# from IPython.display import Image, display
# from langchain_core.runnables.graph import CurveStyle, MermaidDrawMethod, NodeStyles
# with open("agent_graph.png", "wb") as f:
#     f.write(react_agent.get_graph().draw_mermaid_png())
# print("Saved to agent_graph.png")


@asynccontextmanager
async def init_agent():
    async with AsyncPostgresSaver.from_conn_string(conn_info) as memory:
        await memory.setup()

        # agent = create_react_agent(
        #     prompt=SystemMessage(content=prompt),
        #     model=model,
        #     tools=[lc_sql_engine],
        #     pre_model_hook=pre_model_hook,
        #     checkpointer=memory
        # )

        agent = create_agent(
            system_prompt=prompt,
            model=model,
            tools=[lc_sql_engine],
            middleware=[
                SummarizationMiddleware(
                    model="gpt-4o",
                    max_tokens_before_summary=4000,
                    messages_to_keep=20,
                    # trigger=("tokens", 4000),
                    # keep=("messages", 20),
                    # trim_token_to_summarize=1500,
                    # summary_prompts=SUMMARY_GUIDE_PROMPT,
                ),
                schema_scoped_prompt,
            ],
            context_schema=teamContext,
            checkpointer=memory,
        )
        yield agent, memory


SUMMARY_GUIDE_PROMPT = """
You are compressing previous conversation history.

Write a concise, factual summary that preserves:
- the user's goals
- all important facts they mentioned
- all constraints the user gave
- results of any tool calls (as facts, not raw data)
- decisions made or conclusions reached
- unresolved questions

Do NOT:
- hallucinate details
- include raw SQL or tool output
- include step-by-step reasoning
- include apologies or filler text

Your goal: preserve all meaning while reducing token length as much as possible.
"""


async def interact_with_langchain_agent(agent, thread_id, prompt, history):
    history.append(ChatMessage(role="user", content=prompt))
    yield history
    print(f"\n=== 🧠 Starting astream for prompt: {prompt!r} ===")

    config = {"configurable": {"thread_id": thread_id}}

    async for chunk in agent.astream(
        {"messages": [{"role": "user", "content": prompt}]}, config=config
    ):

        # full raw chunk from LangGraph
        print("\n--- RAW CHUNK ---")
        pprint.pp(chunk)  # pretty-print nicely

        # --- (1) MODEL STEP: LLM thinking or tool call ---
        if "agent" in chunk and "messages" in chunk["agent"]:
            msg = chunk["agent"]["messages"][-1]
            content = msg.content or ""
            tool_calls = msg.additional_kwargs.get("tool_calls", [])

            if tool_calls:
                for tool in tool_calls:
                    history.append(
                        ChatMessage(
                            role="assistant", content=f"🛠️ **Using tool** {tool['name']}"
                        )
                    )
                    yield history

            elif content.strip():
                # final AI response
                history.append(ChatMessage(role="assistant", content=content.strip()))
                yield history

        # --- (2) TOOL OUTPUT STEP: results from SQL engine ---
        elif "tools" in chunk and "messages" in chunk["tools"]:
            tool_msg = chunk["tools"]["messages"][-1]
            content = tool_msg.content.strip()
            status = getattr(tool_msg, "status", None)
            if "Error:" in content or (status and status == "error"):
                history.append(
                    ChatMessage(
                        role="assistant",
                        content=f"⚠️ **Tool Error:**\n```\n{content}\n```",
                    )
                )
            else:
                history.append(
                    ChatMessage(
                        role="assistant",
                        content=f"📊 **Tool Result:**\n```\n{content}\n```",
                    )
                )
            yield history

    print("=== ✅ Stream finished ===")

    # print("💬 Received message:", prompt)
    # history.append(ChatMessage(role="assistant", content="Got it."))

    # yield history


# async with AsyncPostgresSaver.from_conn_string(conn_info) as memory:
#     react_agent = create_react_agent(
#         prompt=SystemMessage(content=prompt),
#         model=model,
#         tools=[],
#         # tools=[lc_sql_engine],
#         pre_model_hook=pre_model_hook,
#         checkpointer=memory
#     )


def create_ui(agent, thread_id):

    async def chat_handler(message, history):
        async for history in interact_with_langchain_agent(
            agent, thread_id, message, history
        ):
            yield history

    with gr.Blocks() as ui:
        gr.Markdown("# Chat with a LangChain Agent 🦜⛓️ and see its thoughts 💭")
        chatbot = gr.Chatbot(
            type="messages",
            label="Agent",
            avatar_images=(
                None,
                "https://em-content.zobj.net/source/twitter/141/parrot_1f99c.png",
            ),
        )
        input = gr.Textbox(lines=1, label="Chat Message")
        input.submit(chat_handler, [input, chatbot], [chatbot])

    return ui
