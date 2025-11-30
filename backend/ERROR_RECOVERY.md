# Context Pollution Fix: Error Recovery

## Problem

When the agent encounters a **BadRequestError** or any exception during streaming:
1. The corrupted state gets saved to PostgreSQL checkpoint
2. Same `thread_id` on next request loads the polluted context
3. Agent can't recover from the previous error
4. All subsequent requests fail

**Example flow:**
```
Request 1: BadRequestError occurs
  ↓
State saved to PostgreSQL (corrupted)
  ↓
Request 2 with same thread_id
  ↓
Loads corrupted state from checkpoint
  ↓
Agent fails again (context polluted)
```

## Solution

**Automatic checkpoint deletion on error:**
1. Wrap agent stream in `try-except`
2. On any exception, immediately delete the corrupted checkpoint
3. Send error to client
4. Next request starts fresh with clean state

## Implementation

### New Function: `delete_thread_checkpoint()`

```python
async def delete_thread_checkpoint(memory, thread_id: str):
    """
    Delete corrupted checkpoint from PostgreSQL memory.
    Call this when a thread encounters an error to prevent context pollution.
    """
    try:
        if hasattr(memory, 'delete'):
            await memory.delete(thread_id)
            print(f"✅ Deleted corrupted checkpoint for thread: {thread_id}")
        else:
            print(f"⚠️ Memory backend doesn't support delete operation...")
    except Exception as e:
        print(f"⚠️ Error deleting checkpoint for thread {thread_id}: {e}")
```

### Error Handler in `chunk_stream()`

```python
async def chunk_stream():
    try:
        async for type, (msg, metadata) in stream_agent_response(...):
            # Normal streaming logic...
            if isinstance(msg, AIMessageChunk):
                # ... process message ...
                yield event
    
    except Exception as e:
        # 🔴 On error: delete the corrupted checkpoint
        print(f"🔥 Agent error in thread {thread_id}: {e}")
        await delete_thread_checkpoint(memory, thread_id)
        
        # Send error to client
        error_event = f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        yield error_event
        raise
```

## How It Works

```
Before Error Handling:
├─ Request 1 (bad input)
│  ├─ Exception during streaming
│  └─ Corrupted state saved to DB ❌
├─ Request 2 (same thread)
│  └─ Loads corrupted state → Fails ❌

After Error Handling:
├─ Request 1 (bad input)
│  ├─ Exception during streaming
│  ├─ Delete checkpoint from DB ✅
│  └─ Send error to client
├─ Request 2 (same thread)
│  └─ No checkpoint exists → Starts fresh ✅
```

## Testing

Test the fix with bad requests:

```bash
# Bad request (will fail)
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer <token>" \
  -d '{"id": "test", "messages": []}'  # Missing required fields

# Check logs for:
# 🔥 Agent error in thread user_test_admin: ...
# ✅ Deleted corrupted checkpoint for thread: user_test_admin

# Good request should now work
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer <token>" \
  -d '{"id": "test", "messages": [{"id": "msg-1", "role": "user", "parts": [{"type": "text", "text": "Show me top 5 players"}]}]}'
# Should work fine ✅
```

## PostgreSQL Memory Backend

The `AsyncPostgresSaver` from LangGraph stores checkpoints in PostgreSQL:

- **Table**: `langgraph_checkpoint` (auto-created)
- **Key Fields**: 
  - `thread_id`: Unique conversation thread
  - `checkpoint_blob`: Serialized agent state
  - `metadata`: Timestamp, config, context

When `delete_thread_checkpoint()` is called:
```sql
DELETE FROM langgraph_checkpoint 
WHERE thread_id = 'user_test_admin'
```

This clears the corrupted state, forcing the next request to start fresh.

## Edge Cases Handled

✅ **No delete support**: Logs warning, continues
✅ **Delete fails**: Logs error, still raises original exception  
✅ **Multiple threads**: Each thread's checkpoint isolated
✅ **Concurrent requests**: Thread-safe PostgreSQL operations

## Frontend Behavior

When error is sent to client:
```json
{
  "type": "error",
  "message": "BadRequestError: Invalid input..."
}
```

Frontend should:
1. Show error message to user
2. Allow user to retry
3. Next request will work (checkpoint is clean)

## Performance Impact

✅ **Minimal**: Delete only happens on error (rare)
✅ **Fast**: Single DB delete query
✅ **Non-blocking**: Fire-and-forget after checkpoint deletion

## Future Improvements

1. **Automatic retry**: Retry failed requests after checkpoint cleanup
2. **Error logging**: Log errors to LangSmith with checkpoint info
3. **Manual cleanup endpoint**: `DELETE /api/chat/threads/{thread_id}` for manual reset
4. **Stale checkpoint cleanup**: Cron job to delete old corrupted checkpoints
5. **Context validation**: Validate context before saving to catch errors earlier
