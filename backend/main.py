"""
FastAPI Backend for Protégé - Teachable Agent Platform

Endpoints:
- POST /chat: Stream chat responses from the Protégé agent
- POST /init: Generate initial message when document is uploaded
- POST /upload: Upload and extract text from documents (PDF, TXT, MD)
- GET /strategies: List available pedagogical strategies
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
import io

from agent import generate_response_stream, generate_initial_message, extract_text_from_file
from config.pedagogy import STRATEGIES

app = FastAPI(
    title="Protégé API",
    description="Backend for the Protégé Teachable Agent Platform",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174",  # Docker dev mode
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    context: str = ""
    strategy_id: str | None = None
    history: list[dict] = []


class InitRequest(BaseModel):
    context: str
    strategy_id: str | None = None


@app.get("/")
async def root():
    return {"status": "ok", "message": "App API is running"}


@app.get("/strategies")
async def get_strategies():
    """Return available pedagogical strategies (without prompts)."""
    return {
        strategy_id: {"id": strategy_id, "name": data["name"]}
        for strategy_id, data in STRATEGIES.items()
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Stream a chat response from the Protégé agent.
    
    Uses Server-Sent Events (SSE) for real-time streaming.
    """
    async def event_generator():
        try:
            async for chunk in generate_response_stream(
                message=request.message,
                context=request.context,
                strategy_id=request.strategy_id,
                history=request.history
            ):
                yield {
                    "event": "message",
                    "data": json.dumps({"text": chunk})
                }
            yield {
                "event": "done",
                "data": json.dumps({"status": "complete"})
            }
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }
    
    return EventSourceResponse(event_generator())


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file and extract text content using Google Gemini.
    Supports PDF, TXT, and Markdown files.
    """
    try:
        # Read file content
        contents = await file.read()
        
        # Extract text using Gemini (handles PDFs natively)
        text = await extract_text_from_file(contents, file.filename or "document", file.content_type or "")
        
        return {
            "text": text,
            "filename": file.filename,
            "content_type": file.content_type,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@app.post("/init")
async def init_conversation(request: InitRequest):
    """
    Generate an initial message from Alex when a document is first uploaded.
    """
    try:
        message = await generate_initial_message(
            context=request.context,
            strategy_id=request.strategy_id
        )
        return {"message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
