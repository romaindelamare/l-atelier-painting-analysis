---
name: run-app
description: Start the Painting Analysis Studio app with both backend and frontend servers. Use this whenever the user wants to run, start, or launch the app locally. This skill handles installing dependencies, starting the FastAPI backend (port 8000) and Vite frontend dev server (port 5173), and verifies both servers are ready.
compatibility: Requires Python 3.8+, Node.js, npm, and PowerShell (on Windows) or bash (on Unix-like systems)
---

# Run Painting Analysis Studio

This skill starts the complete Painting Analysis Studio application with both the Python FastAPI backend and React frontend running together.

## What the skill does

- **Checks and installs dependencies** for both backend (Python packages) and frontend (npm modules)
- **Starts the FastAPI backend** on port 8000 with hot reload enabled
- **Starts the Vite dev server** on port 5173 for the React frontend
- **Verifies both servers are running** and ready to accept requests
- **Reports the URLs** where the app is accessible

## Prerequisites

The project has the following structure:
```
painting-object-detection/
├── backend/
│   ├── app/
│   │   └── main.py          # FastAPI entry point
│   ├── requirements.txt      # Python dependencies
│   └── .venv/               # Virtual environment (if using one)
└── frontend/
    ├── src/
    ├── package.json         # NPM dependencies
    └── node_modules/        # NPM packages
```

## How to use

When the user asks to "start the app", "run the app", "launch the app", or similar:

### Step 1: Install dependencies

**Backend dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend dependencies:**
```bash
cd frontend
npm install
```

Note: Skip these steps if dependencies are already installed. You can detect this by checking:
- Backend: Try importing fastapi. If it fails, install.
- Frontend: Check if `node_modules/` exists with significant size, or try `npm list`.

### Step 2: Start both servers in parallel

Launch both servers as background processes or in separate terminal sessions:

**Backend (in `backend/` directory):**
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (in `frontend/` directory):**
```bash
npm run dev
```

The `--reload` flag enables hot reloading when code changes.

### Step 3: Verify servers are ready

Wait for both servers to report they're ready:

- **Backend ready signal:** Look for `"Application startup complete"` in the output
- **Frontend ready signal:** Look for `"ready in XXX ms"` and the `http://localhost:5173` URL in the output

### Step 4: Report success

Once both are ready, tell the user:
- Backend is running at: `http://localhost:8000`
- Frontend (app) is running at: `http://localhost:5173`
- The API health check endpoint is available at: `http://localhost:8000/api/health`

## What the app does

**L'Atelier — Painting Analysis Studio** is a painting object detection tool:
- Users upload artwork images through the frontend
- The backend analyzes images using object detection
- Objects within paintings are identified and cataloged
- Results are stored and can be viewed in a collection gallery

## Troubleshooting

**Backend won't start**
- Check that Python 3.8+ is installed: `python --version`
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Make sure port 8000 isn't in use: `netstat -an | grep 8000` (Windows) or `lsof -i :8000` (macOS/Linux)

**Frontend won't start**
- Check that Node.js and npm are installed: `node --version && npm --version`
- Ensure all npm packages are installed: `npm install`
- Make sure port 5173 isn't in use

**CORS errors when accessing the API**
- The backend has CORS configured for `http://localhost:5173` in `app/main.py`
- If you changed the frontend port, update the CORS settings

**Port already in use**
- Backend: Kill the process on port 8000 and restart
- Frontend: Vite will automatically prompt to use a different port if 5173 is taken

## Implementation notes for Claude

- Use background task launching to run both servers concurrently
- Monitor the output logs for the specific "ready" signals mentioned above
- Both servers must stay running for the app to work properly
- The backend will auto-reload when Python files change (with `--reload`)
- The frontend will auto-reload when React/TypeScript files change
- If either server crashes, report the error and suggest fixes
