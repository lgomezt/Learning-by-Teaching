# Protégé: Learn by Teaching

A Teachable Agent (TA) platform where an AI acts as a peer student who must be taught by the user. This prototype leverages the **Protégé Effect** and **Learning by Teaching** principles to enhance learning outcomes.

## 🏗️ Architecture

```
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── components/    # UI components
│       ├── config/        # UI metadata (NO prompts)
│       ├── context/       # React Context state
│       └── hooks/         # Custom hooks
│
└── backend/           # Python + FastAPI + Google ADK
    └── config/
        └── pedagogy.py    # SINGLE SOURCE OF TRUTH for all prompts
```

**Key Design Decision:** All prompt engineering lives exclusively in the backend. Researchers can modify prompts by editing only `backend/config/pedagogy.py` without touching frontend code.

## 🚀 Getting Started

### Quick Start with Docker (Recommended)

The easiest way to run the application is using Docker Compose. This ensures consistent environments across different machines and eliminates setup issues - no need to install Python, Node.js, or manage dependencies manually!

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- Google AI API Key ([Get one here](https://aistudio.google.com/apikey))

#### Steps

1. **Clone the repository** (if you haven't already)
   ```bash
   git clone <repository-url>
   cd "Learning by Teaching"
   ```

2. **Set up environment variables**
   
   Create a `.env` file in the `backend/` directory:
   ```bash
   cd backend
   echo "GOOGLE_API_KEY=your_api_key_here" > .env
   ```
   
   Or manually create `backend/.env` with:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```
   
   Replace `your_api_key_here` with your actual Google AI API key.

3. **Build and start the containers**
   
   From the project root:
   ```bash
   docker-compose up --build
   ```
   
   The first time this runs, it will:
   - Build the backend Docker image (Python 3.11 + dependencies)
   - Build the frontend Docker image (Node.js + React build)
   - Start both services
   - Make the app available at [http://localhost:5173](http://localhost:5173)

4. **Access the application**
   
   - Frontend: [http://localhost:5173](http://localhost:5173) (production) or [http://localhost:5174](http://localhost:5174) (dev mode)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Docker Commands

- **Start services**: `docker-compose up`
- **Start in background**: `docker-compose up -d`
- **Stop services**: `docker-compose down`
- **View logs**: `docker-compose logs -f`
- **View logs for specific service**: `docker-compose logs -f backend` or `docker-compose logs -f frontend`
- **Rebuild after changes**: `docker-compose up --build`
- **Restart a service**: `docker-compose restart backend` or `docker-compose restart frontend`
- **Remove containers and volumes**: `docker-compose down -v`

#### Development Mode (with Hot Reload)

For development with automatic code reloading (changes to code will automatically refresh):

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**Important:** You must use both `-f docker-compose.yml -f docker-compose.dev.yml` together. The dev file extends the base configuration.

This enables:
- **Hot reloading** for both backend (Python) and frontend (React/Vite)
- **Volume mounting** for live code changes (edit files locally, see changes immediately)
- **Faster iteration** during development

In development mode:
- Backend runs with `--reload` flag (auto-restarts on Python file changes)
- Frontend runs Vite dev server (instant HMR for React components)
- Both services watch for file changes automatically
- Frontend is available at **http://localhost:5174** (uses port 5174 to avoid conflicts with local Vite servers)

#### Production Mode

For production deployment, use the standard `docker-compose.yml`:

```bash
docker-compose up -d --build
```

This runs:
- Backend as a production FastAPI server
- Frontend as a static build served by Nginx

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide Icons
- pdfjs-dist (PDF text extraction)

**Backend:**
- FastAPI
- Google ADK (Agent Development Kit)
- Gemini 3.0 Flash Preview
- SSE Streaming

## 📄 License

MIT License - See LICENSE for details.
