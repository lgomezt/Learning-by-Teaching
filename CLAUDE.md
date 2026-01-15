# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Protégé is a Teachable Agent (TA) platform where an AI named "Alex" acts as a peer student who must be taught by the user. It leverages the Protégé Effect and Learning by Teaching principles for enhanced learning.

## Development Commands

### Quick Start (Docker - Recommended)
```bash
# Development mode with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production mode
docker-compose up -d --build
```

### Manual Development
```bash
# Backend (Python)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (React)
cd frontend
npm install
npm run dev
```

### Other Commands
```bash
# Frontend
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint

# Backend requires GOOGLE_API_KEY in backend/.env
```

## Architecture

### Key Design Decision
**All prompt engineering lives exclusively in `backend/config/pedagogy.py`**. The frontend only contains UI metadata (labels, colors, icons) in `frontend/src/config/pedagogy.ts`. Strategy IDs are sent to the backend, which looks up the actual prompts.

### Project Structure
```
backend/
├── main.py              # FastAPI endpoints: /chat, /init, /upload, /strategies
├── agent.py             # Gemini client, streaming, tool definitions for canvas
└── config/pedagogy.py   # SINGLE SOURCE OF TRUTH for all prompts and strategies

frontend/src/
├── context/AppContext.tsx   # Global state: documents, messages, strategies, canvas
├── hooks/
│   └── useTeachableAgent.ts # Chat logic, canvas tool execution
├── lib/api.ts               # Backend API client with SSE streaming
├── config/pedagogy.ts       # UI metadata only (NO prompts)
└── components/
    ├── Chat/                # ChatWindow, MessageBubble, ChatInput
    ├── Canvas/              # ComparisonWorkspace, SimpleCanvas (for comparison mode)
    ├── Pedagogy/            # StrategySidebar, StrategyCard
    └── Library/             # FileUploader, SourceList
```

### Data Flow
1. User uploads document → Backend extracts text (PyPDF2 or Gemini fallback)
2. User selects strategy → Strategy ID sent with each message to backend
3. Backend builds system prompt from `pedagogy.py` based on strategy ID
4. Response streams via SSE; for "comparison" mode, includes tool calls (`addToCanvas`, `setColumnLabels`)
5. Frontend executes tool calls on canvas via `canvasRef` in AppContext

### Learning Strategies
Defined in `backend/config/pedagogy.py`:
- `retrieval` - Practice Testing (recall from memory)
- `elaborative_interrogation` - Explain the "why" behind facts
- `comparison` - Visual T-chart comparison (uses canvas tools)
- `critiquing` - Evaluate flawed logic
- `analogies` - Real-world examples and mental models

### Canvas/Whiteboard (Comparison Mode)
When `strategy_id="comparison"`, the agent has access to:
- `addToCanvas(text, column, is_unsure)` - Add card to left/right/middle
- `setColumnLabels(left, right)` - Set column headers

Tool calls are executed via `useTeachableAgent.executeToolCall()` which manipulates the canvas through `canvasRef`.

## URLs
- Frontend dev: http://localhost:5174 (Docker) or http://localhost:5173 (local)
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs
