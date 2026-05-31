# Copilot Instructions

Instructions for AI coding agents working in this repository.

## Project At A Glance

- Backend: FastAPI + SQLAlchemy + SQLite in [backend/app](../backend/app)
- Frontend: React + TypeScript + Vite in [frontend/src](../frontend/src)
- Core flow: upload image -> detect elements (Interfaze) -> extract palette (Pillow) -> persist -> render overlays
- Canonical project and API overview: [README.md](../README.md)

## Fast Start

### Backend

1. Create and activate venv in [backend](../backend)
2. Install dependencies: `pip install -r requirements.txt`
3. Create env file from [backend/.env.example](../backend/.env.example)
4. Run API: `uvicorn app.main:app --reload`

### Frontend

1. Install dependencies in [frontend](../frontend): `npm install`
2. Run dev server: `npm run dev`
3. Build for production: `npm run build`

Note: frontend dev proxy expects backend on `http://localhost:8000` (see [frontend/vite.config.ts](../frontend/vite.config.ts)).

## What To Read Before Editing

- Dependency wiring and boundaries: [backend/app/api/dependencies.py](../backend/app/api/dependencies.py)
- Core orchestration logic: [backend/app/services/painting_service.py](../backend/app/services/painting_service.py)
- Backend interfaces (swap implementations safely): [backend/app/interfaces](../backend/app/interfaces)
- API handlers and response shapes: [backend/app/api/routes/paintings.py](../backend/app/api/routes/paintings.py)
- Test fixtures and fake services: [backend/tests/conftest.py](../backend/tests/conftest.py)
- Frontend API layer: [frontend/src/api/client.ts](../frontend/src/api/client.ts)
- Frontend domain types: [frontend/src/types/painting.ts](../frontend/src/types/painting.ts)

## Repository Conventions

- Keep services implementation-agnostic: pass abstract collaborators, do not hardcode providers in service code.
- Register concrete implementations in [backend/app/api/dependencies.py](../backend/app/api/dependencies.py), not inside route handlers or services.
- Keep environment reads centralized in [backend/app/config.py](../backend/app/config.py); avoid ad hoc `os.environ` access elsewhere.
- Preserve typed contracts across backend schema and frontend types when changing API payloads.
- Prefer deterministic tests with fakes over network-dependent tests.

## Validation Checklist

- Backend changes: run `pytest` from [backend](../backend)
- Frontend changes: run `npm run build` from [frontend](../frontend)
- API contract changes: update both backend schemas and frontend types/client together

## Common Pitfalls

- Missing `INTERFAZE_API_KEY` causes detection failures at runtime.
- Changing frontend dev port without updating backend CORS or proxy config causes request failures.
- Moving image or DB paths without syncing settings in [backend/app/config.py](../backend/app/config.py) breaks uploads/serving.

## Scope Guidance For Agents

- Prefer small, focused edits that preserve current architecture and dependency boundaries.
- Do not add new frameworks or broad refactors unless explicitly requested.
- If asked to run the full app, use [./.github/skills/run-app/SKILL.md](skills/run-app/SKILL.md).
- If asked to locate/count items in images, use [./.github/skills/object-detection/SKILL.md](skills/object-detection/SKILL.md).
- Legacy Claude skill copies remain in [.claude/skills](../.claude/skills) for compatibility.
