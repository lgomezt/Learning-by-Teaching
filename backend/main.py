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


# Legacy T-chart canvas card format
class LegacyCanvasCardState(BaseModel):
    id: str
    text: str
    x: float
    y: float
    column: str
    color: str | None = None


# New freeform canvas types
class ConceptBoxState(BaseModel):
    id: str
    name: str
    color: str
    x: float
    y: float
    width: float = 140
    height: float = 50


class FreeformCardState(BaseModel):
    id: str
    text: str
    x: float
    y: float
    color: str | None = None
    isUnsure: bool = False
    createdAt: float = 0


class DrawingStrokePoint(BaseModel):
    x: float
    y: float


class DrawingStrokeState(BaseModel):
    id: str
    points: list[DrawingStrokePoint] = []
    color: str = "#374151"
    strokeWidth: float = 3


# Flexible canvas state that accepts both formats
class CanvasState(BaseModel):
    # Legacy format fields
    cards: list[LegacyCanvasCardState | FreeformCardState] = []
    columnLabels: dict | None = None
    # New freeform format fields
    conceptBoxes: list[ConceptBoxState] = []
    drawings: list[DrawingStrokeState] = []


class ChatRequest(BaseModel):
    message: str
    context: str = ""
    strategy_id: str | None = None
    history: list[dict] = []
    canvas_state: CanvasState | None = None


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
    Supports tool calls for comparison mode (canvas manipulation).
    """
    async def event_generator():
        try:
            # Convert canvas_state to dict if provided
            canvas_state_dict = None
            if request.canvas_state:
                canvas_state_dict = {
                    "cards": [card.model_dump() for card in request.canvas_state.cards],
                    "conceptBoxes": [box.model_dump() for box in request.canvas_state.conceptBoxes],
                    "drawings": [stroke.model_dump() for stroke in request.canvas_state.drawings],
                }
                # Include columnLabels if present (legacy format)
                if request.canvas_state.columnLabels:
                    canvas_state_dict["columnLabels"] = request.canvas_state.columnLabels
            
            async for event in generate_response_stream(
                message=request.message,
                context=request.context,
                strategy_id=request.strategy_id,
                history=request.history,
                canvas_state=canvas_state_dict
            ):
                # Handle text chunks
                if "text" in event:
                    yield {
                        "event": "message",
                        "data": json.dumps({"text": event["text"]})
                    }
                
                # Handle tool calls
                if "tool_call" in event:
                    yield {
                        "event": "message",
                        "data": json.dumps({"tool_call": event["tool_call"]})
                    }
            
            yield {
                "event": "done",
                "data": json.dumps({"status": "complete"})
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
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
        print(f"[/init] Received request - strategy_id: {request.strategy_id}, context_length: {len(request.context)}")
        message = await generate_initial_message(
            context=request.context,
            strategy_id=request.strategy_id
        )
        print(f"[/init] Success - message length: {len(message)}")
        return {"message": message}
    except Exception as e:
        import traceback
        print(f"[/init] ERROR: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
