# LangSmith Live Agent Monitoring

This guide explains how to monitor your **live FastAPI agent** running in `app.py` using LangSmith.

## What You'll Monitor

✅ **Your actual production agent** with:
- AsyncPostgreSQL memory (thread persistence)
- Team-scoped schema context injection
- Real user requests and authentication
- Live SQL execution on RDS database
- Token usage and latency metrics

## Prerequisites

✅ Python 3.12+ (verified)
✅ LangSmith account (free tier at https://smith.langchain.com)
✅ Backend running with `uvicorn app:app`

## Setup (2 Steps)

### Step 1: Get LangSmith API Key

1. Go to https://smith.langchain.com/settings/api-keys
2. Create a new API key (format: `lsv2_...`)
3. Copy the full key

### Step 2: Add to .env

Edit `backend/.env` and uncomment/update:

```bash
# LangSmith tracing - tracks the live agent in app.py
LANGSMITH_API_KEY=lsv2_your_key_here
LANGSMITH_PROJECT=sports-analytics-agent
LANGSMITH_TRACING=true
```

## Start Backend with Tracing

```bash
cd backend
source .venv/bin/activate
python -m uvicorn app:app --reload --host 127.0.0.1 --port 5000
```

You should see:
```
✅ LangSmith tracing enabled - visit https://smith.langchain.com to monitor agent
✅ Agent initialized: <class 'langgraph.graph.state_graph.CompiledStateGraph'>
✅ Memory saver initialized: <class 'langgraph.checkpoint.postgres.aio.AsyncPostgresSaver'>
```

## Monitor in LangSmith

1. Open https://smith.langchain.com
2. Go to your project: `sports-analytics-agent`
3. Click "Runs" to see incoming traces

## Send a Test Query

Use your frontend or curl:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "messages": [{
      "id": "msg-1",
      "role": "user",
      "parts": [{"type": "text", "text": "Show me top 5 players"}]
    }]
  }'
```

## What LangSmith Shows

Each query will create a **trace** with:

### 📊 Metrics
- **Tokens used** - input, output, total (with cost estimation)
- **Latency** - time to first token, total time
- **Requests** - API calls count

### 🔍 Full Execution Tree
```
sports_analytics_agent (root trace)
├── 🧠 LLM Call #1
│   ├── Input: "Show me top 5 players"
│   ├── Schema: team_123.player, team_123.match_stats, ...
│   ├── Prompt: "You are an intelligent Sports Analytics Assistant..."
│   └── Output: "I'll query the players table for you"
├── 🛠️ Tool Call: sql_tool
│   ├── Input: "SELECT * FROM team_123.player ORDER BY points DESC LIMIT 5"
│   ├── Duration: 245ms
│   └── Output: [{"id": 1, "name": "John", "points": 1250}, ...]
├── 🧠 LLM Call #2
│   ├── Input: [Query results from tool]
│   └── Output: "Here are the top 5 players: ..."
└── ✅ Final Output
```

### 🔐 Context Captured
- **Team ID** - which team's schema was used
- **Thread ID** - conversation history persistence
- **User** - JWT authenticated username
- **Schema Description** - tables available to agent
- **Tool Inputs/Outputs** - SQL queries and results

## Use Cases

### 🐛 Debug Issues
- Agent querying wrong schema? See which schema was injected
- SQL query failing? View exact query and error
- Token limit exceeded? Check where tokens went
- Wrong table structure? See schema description sent to LLM

### 📈 Optimize Performance
- Which queries are slowest?
- Which users have longest latencies?
- How much does each query cost?
- When does memory checkpointing happen?

### 🎯 Analyze Behavior
- How often does agent use tools?
- What kinds of queries does it run?
- How many LLM calls per user request?
- Success rate: how many queries fail?

### 🧪 Test Iterations
- Try different prompts in `langchain_assistant.py`
- Monitor if behavior improves
- Compare traces before/after changes
- Share traces with team for feedback

## Code Changes Made

### ✅ `app.py`
```python
# Loads LANGSMITH_API_KEY from .env and enables tracing
langsmith_api_key = os.getenv("LANGSMITH_API_KEY")
if langsmith_api_key:
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_PROJECT"] = os.getenv("LANGSMITH_PROJECT", "sports-analytics-agent")
    print("✅ LangSmith tracing enabled...")
```

### ✅ `langchain_assistant.py`
```python
# Import traceable decorator from langsmith
from langsmith import traceable
```

### ✅ `routers/assistant.py`
```python
# Wrapped agent streaming with @traceable decorator
@traceable(name="sports_analytics_agent", run_type="llm")
async def stream_agent_response(agent, input_state, thread_id, context):
    """Traced wrapper ensures all LLM calls and tools are recorded"""
    async for msg_type, (msg, metadata) in agent.astream(...):
        yield (msg_type, (msg, metadata))
```

## Advanced: Disable Tracing Locally

If you want to run the agent without sending traces to LangSmith:

```bash
# Option 1: Don't set LANGSMITH_API_KEY in .env
# Option 2: Explicitly disable in .env
LANGSMITH_TRACING=false
# Option 3: Set empty API key
LANGSMITH_API_KEY=
```

## Troubleshooting

### "Agent traces not appearing"
- ✅ Check: LANGSMITH_API_KEY is set in `.env`
- ✅ Check: Backend started AFTER editing `.env`
- ✅ Check: You sent a chat query (traces only appear on requests)
- ✅ Wait: Can take 5-10 seconds to appear in UI

### "ImportError: No module named 'langsmith'"
- **Already installed!** (`langsmith==0.4.44` in requirements.txt)
- Run: `pip install -r requirements.txt` in case

### "LANGSMITH_TRACING not taking effect"
- Make sure you set it in `.env` and restarted backend
- LangChain reads env vars at import time
- Restart with: `pkill -f "uvicorn app"` then restart

## Example LangSmith Trace

```json
{
  "name": "sports_analytics_agent",
  "run_type": "llm",
  "start_time": "2024-11-29T10:15:30.123Z",
  "end_time": "2024-11-29T10:15:35.456Z",
  "inputs": {
    "user_message": "Show me top 5 players",
    "team_id": "team_uuid_12345",
    "schema_name": "team_12345_schema"
  },
  "outputs": {
    "final_response": "Here are the top 5 players..."
  },
  "metadata": {
    "user": "john_doe",
    "thread_id": "user_john_doe",
    "model": "gpt-4o",
    "token_usage": {
      "input_tokens": 1250,
      "output_tokens": 320,
      "total_tokens": 1570,
      "cost_usd": 0.021
    }
  },
  "child_runs": [
    {
      "name": "sql_tool",
      "run_type": "tool",
      "inputs": "SELECT * FROM team_12345_schema.player ORDER BY points DESC LIMIT 5",
      "outputs": "[{id:1, name:John, points:1250}, ...]",
      "duration_ms": 245
    }
  ]
}
```

## Next Steps

1. **Send queries** through your frontend
2. **Monitor traces** at https://smith.langchain.com/projects/sports-analytics-agent
3. **Identify bottlenecks** - which queries are slow?
4. **Iterate on prompts** in `langchain_assistant.py`
5. **Compare before/after** traces to measure improvements
6. **Set up alerts** for errors or high token usage (paid tier feature)

---

**Remember**: Traces contain your actual data (queries, results, user info). If you have privacy concerns, set `LANGSMITH_TRACING=false` or ensure your LangSmith workspace is properly secured.
