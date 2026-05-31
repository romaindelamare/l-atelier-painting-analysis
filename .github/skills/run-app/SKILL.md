---
name: run-app
description: Start the Painting Analysis Studio app with both backend and frontend servers. Use this whenever the user wants to run, start, or launch the app locally. This skill handles installing dependencies, starting the FastAPI backend (port 8000) and Vite frontend dev server (port 5173), and verifies both servers are ready.
compatibility: Requires Python 3.8+, Node.js, npm, and PowerShell (on Windows) or bash (on Unix-like systems)
---

# Run Painting Analysis Studio

This skill starts the complete Painting Analysis Studio application with both the Python FastAPI backend and React frontend running together.

## What the skill does

- Checks and installs dependencies for both backend (Python packages) and frontend (npm modules)
- Starts the FastAPI backend on port 8000 with hot reload enabled
- Starts the Vite dev server on port 5173 for the React frontend
- Verifies both servers are running and ready to accept requests
- Reports the URLs where the app is accessible

## Prerequisites

The project has the following structure:

```text
painting-object-detection/
|- backend/
|  |- app/
|  |  \- main.py
|  |- requirements.txt
|  \- .venv/
\- frontend/
   |- src/
   |- package.json
   \- node_modules/
```

## How to use

When the user asks to "start the app", "run the app", "launch the app", or similar:

### Step 1: Install dependencies

Backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Frontend dependencies:

```bash
cd frontend
npm install
```

Skip these steps if dependencies are already installed.

### Step 2: Start both servers in parallel

Launch both servers as background processes or in separate terminal sessions.

Backend in backend directory:

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend in frontend directory:

```bash
npm run dev
```

### Step 3: Verify servers are ready

Wait for both servers to report they are ready.

- Backend ready signal: "Application startup complete"
- Frontend ready signal: "ready in ... ms" and `http://localhost:5173`

### Step 4: Report success

Once both are ready, report:

- Backend is running at `http://localhost:8000`
- Frontend is running at `http://localhost:5173`
- API health endpoint is available at `http://localhost:8000/api/health`

## Troubleshooting

Backend will not start:

- Check Python version: `python --version`
- Ensure dependencies are installed: `pip install -r requirements.txt`
- Ensure port 8000 is free

Frontend will not start:

- Check Node and npm versions: `node --version` and `npm --version`
- Ensure dependencies are installed: `npm install`
- Ensure port 5173 is free

CORS errors:

- Backend CORS allowlist is configured in backend app startup
- If frontend port changes, update CORS and Vite proxy configuration

Port already in use:

- Stop existing process and restart
- Vite can auto-select another port if needed

## Agent implementation notes

- Use asynchronous terminals to keep both servers running concurrently.
- Monitor logs for readiness signals before reporting success.
- If either server fails, return the error and likely remediation.
