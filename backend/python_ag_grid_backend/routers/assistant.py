from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from langchain.messages import AIMessageChunk, AIMessage, ToolMessage, ToolCallChunk, ToolCall, HumanMessage, SystemMessage
from typing import Any, Callable, Dict, Mapping, Sequence, Optional
from pydantic import BaseModel 
from .login import get_current_user, UserPublic
import json
import uuid

class ToolCall(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    input: str = ""
    
# class ChatMessage(BaseModel):
#     message: str
    
# class UserTeamPublic: 
#     username: str | None = None 

class MessagePart(BaseModel):
    type: str
    text: str | None = None

class Message(BaseModel):
    id: str 
    role: str
    parts: list[MessagePart]
    
# What assistant-ui send to the backend
class ChatPayload(BaseModel):
    # messages: list[Message]
    # tools: Optional[dict] = None
    # unstable_assistantMessageId: Optional[str] = None
    # runConfig: Optional[dict] = None
    
    id: str
    messages: list[Message]
    trigger: str | None = None
    
    class Config:
        extra = "allow"

router = APIRouter()

@router.post("")
async def assistant(
    payload: ChatPayload,
    request: Request,
    currentUser: UserPublic = Depends(get_current_user)
    ):
    
    app = request.app
    agent = getattr(app.state, "agent", None)
    memory = getattr(app.state, "agent_mem", None)
    
    if agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    # Change to pydantic model for request schema parsing user_id + message
    # body = await request.json()
    # user_id = body["user_id"]
    # user_message = body["message"]
    
    # Scope thread by User ID - for now
        
    user_id = currentUser.username
    thread_id = f"user_{user_id}"
    user_message = payload.messages[-1].parts[-1].text
    
    # user_message = payload.message
    
    # Input messages object, to be merged with agent state, internally: 
                                # class MessagesState(TypedDict):
                                # messages: Annotated[list, "Chat history"]
    input_state = {"messages": [{"role": "user", "content": user_message}]} 
    
    async def chunk_stream():
        stream_id = ""
        event = None
        
        tool_calls: Dict[int, ToolCall] = {}
        inTextBlock = False
        finish_metadata: Dict[str, any] = {}
        seen_msg_ids: set[str] = set()
        
        async for type, (msg, metadata) in agent.astream(
            input=input_state,
            config={"configurable": {"thread_id": thread_id}},
            # stream_mode=["updates"]
            stream_mode=["messages"]
        ):
            # msg = chunk[1][0] 
            # meta_data = chunk[1][1] 
            stream_id = msg.id
            print(msg)
                            
            # Yielding SSE-compatible strings 
            # if isinstance(msg, AIMessageChunk):
            #     if msg.tool_call_chunks:
            #         yield f"data: {msg.tool_call_chunks[0].get("args")}\n\n"
            #     else:
            #         yield f"data: {msg.content}\n\n"
                
            #     if getattr(msg, "usage_metadata", None):
            #         usage_summary = msg.usage_metadata
            # elif isinstance(msg, ToolMessage):
            #     payload = json.dumps({"type": "tool_result", "function_name": msg.name, "result": msg.content}) # Add type tool_result for FrontEnd to distinguish between json payload / raw string data
            #     yield f"data: {payload}\n\n"
                
            # Yielding SSE-compatible strings with Vercal AI SDK v5 to be consumed by frontend assistant-ui 
            if isinstance(msg, AIMessageChunk):
                
                if stream_id not in seen_msg_ids:
                    event = f"data: {json.dumps({"type":"start", "messageId":stream_id})}\n\n"
                    seen_msg_ids.add(stream_id)
                    print(event)
                    print("\n\n")
                    yield event
                    
                # New AIMessage Stream - either a tool call / text stream
                tool_call = getattr(msg, "tool_call_chunks", None)
                 
                if tool_call:
                    toolCallChunk = tool_call[0]
                    
                    toolCallId, toolName, toolInput, toolIdx = toolCallChunk.get("id"), toolCallChunk.get("name"), toolCallChunk.get("args"), toolCallChunk.get("index")
                    
                    if toolName: 
                        
                        tool_calls[toolIdx] = ToolCall(
                            id=toolCallId, 
                            name=toolName
                        )
                        
                        event = f"data: {json.dumps({"type":"tool-input-start","toolCallId":toolCallId,"toolName":toolName})}\n\n" 
                        print(event)
                        print("\n\n") 
                        yield event
                        
                    else: 
                        
                        tool_call = tool_calls[toolIdx]
                        toolCallId = tool_call.id
                        delta = toolInput
                        tool_call.input += delta
                        event = f"data: {json.dumps({"type":"tool-input-delta","toolCallId":toolCallId,"inputTextDelta":delta})}\n\n"
                        print(event)
                        print("\n\n")   
                        yield event 
                                       
                else:
                    if msg.content == '':
                        finish_reason = getattr(msg, "response_metadata", {}).get("finish_reason") 
                        
                        usage = getattr(msg, "usage_metadata", None)  
                        
                        # Stream finishes when chunk_position = last
                        finish = getattr(msg, "chunk_position", None) 
                        
                        if usage: # Usage Metadata, add to finish message metadata
                            usage_payload = {
                                "promptTokens": usage.get("input_tokens"),
                                "completionTokens": usage.get("output_tokens"),
                                "totalTokens": usage.get("total_tokens")
                            }
                            # event = f"data: {json.dumps({"type": "summary", "total_tokens": total_tokens})}" 
                            finish_metadata["usage"] = usage_payload
                            
                        elif finish_reason: # End of the current stream - before metadata
                            if finish_reason == 'tool_calls':
                                
                                for idx, tool_call in tool_calls.items():
                                    
                                    toolCallId = tool_call.id
                                    toolName = tool_call.name
                                    input = tool_call.input
                                    
                                    event = f"data: {json.dumps({"type":"tool-input-available","toolCallId":toolCallId,"toolName":toolName,"input":input})}\n\n" 
                                    
                                    print(event)
                                    print("\n\n")
                                    
                                    yield event
                            else:
                                inTextBlock = False
                                event = f"data: {json.dumps({"type":"text-end","id":stream_id})}\n\n"
                                print(event)
                                print("\n\n") 
                                yield event
                        elif finish:
                            event = f"data: {json.dumps({"type":"finish", "messageMetadata": finish_metadata}) if finish_metadata else json.dumps({"type":"finish"})}\n\n"
                            print(event)
                            print("\n\n") 
                            yield event
                    else: 
                        if not inTextBlock:
                            event = f"data: {json.dumps({"type":"text-start","id":stream_id})}\n\n"
                            inTextBlock = True
                            # print(event)
                            # print("\n\n")   
                            yield event
                            
                        delta = msg.content
                        event = f"data: {json.dumps({"type":"text-delta","id":stream_id,"delta":delta})}\n\n"  
                        print(event)
                        print("\n\n")  
                        yield event      
            elif isinstance(msg, ToolMessage):
                payload = json.dumps({"type": "tool-output-available", "toolCallId": msg.tool_call_id, "output": msg.content})
                event = f"data: {payload}\n\n"  
                print(event)
                print("\n\n")  
                
                yield event  

        # if usage_summary:
        #     total_tokens = usage_summary.get("total_tokens", 0)
        #     payload = json.dumps({"type": "summary", "total_tokens": total_tokens}) # Same logic as tool_result, add type summary
        #     event f"data: {payload}\n\n"
        # else:
        #     yield f"data: STREAMING FINISHED\n\n"
        event = f"data: [DONE]\n\n"
        print(event)
        yield event
        
        return
        
    response = StreamingResponse(chunk_stream(), media_type="text/event-stream")
    return patch_response_with_headers(response, "data")
        
def patch_response_with_headers(
response: StreamingResponse,
protocol: str = "data",
) -> StreamingResponse:
    """Apply the standard streaming headers expected by the Vercel AI SDK."""

    response.headers["x-vercel-ai-ui-message-stream"] = "v1"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"

    if protocol:
        response.headers.setdefault("x-vercel-ai-protocol", protocol)

    return response
            
    