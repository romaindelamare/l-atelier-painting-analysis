# L'Atelier - Painting Element Detection

Upload a painting and the studio identifies every element within the composition
(via **Interfaze AI** object detection) and reads its dominant **color palette**
(via a non-LLM, Pillow median-cut extractor). Each analysed work is filed in a
museum-styled collection with an interactive, annotated detail view.

- **Backend** — Python · FastAPI · SQLAlchemy · SQLite
- **Frontend** — React · TypeScript · Vite · Tailwind CSS v4
- **Object detection** — Interfaze AI (OpenAI-compatible API, `interfaze-beta`)
- **Color palette** — Pillow median-cut quantization (deterministic, no LLM)

The code follows SOLID principles: services depend on abstract interfaces
(`ObjectDetector`, `ImageStorage`, `PaletteExtractor`) wired through FastAPI
dependency injection, so any implementation can be swapped or faked in tests.

```
painting-object-detection/
├── backend/    FastAPI service (detection orchestration, persistence, image serving)
└── frontend/   Vite + React + TypeScript + Tailwind SPA
```

## Prerequisites

- Python 3.11+ (developed on 3.13)
- Node.js 18+ (developed on 22)
- An Interfaze AI API key

## 1. Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:  .venv\Scripts\Activate.ps1
# macOS/Linux:         source .venv/bin/activate
pip install -r requirements.txt

# Configure secrets
cp .env.example .env        # then edit .env and set INTERFAZE_API_KEY
```

`.env` variables (see `.env.example`):

| Variable             | Default                            | Purpose                          |
| -------------------- | ---------------------------------- | -------------------------------- |
| `INTERFAZE_API_KEY`  | _(required)_                       | Interfaze AI credential          |
| `INTERFAZE_BASE_URL` | `https://api.interfaze.ai/v1`      | API base URL                     |
| `INTERFAZE_MODEL`    | `interfaze-beta`                   | Detection model                  |
| `IMAGE_DIR`          | `./data/images`                    | Where uploaded images are stored |
| `DB_URL`             | `sqlite:///./data/paintings.db`    | SQLite database                  |
| `PALETTE_SIZE`       | `6`                                | Dominant colors to extract       |

Run the API (creates `data/` and the SQLite tables on first start):

```bash
uvicorn app.main:app --reload      # http://localhost:8000  (docs at /docs)
```

Run the tests (no network or API key needed — fakes are injected):

```bash
pytest
```

## 2. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The Vite dev server proxies `/api` and `/images` to the backend on port 8000, so
start the backend first.

## Using the app

1. Open <http://localhost:5173>.
2. On **Upload**, drag in a painting (optionally add title / artist / year / notes)
   and click **Analyze Painting**.
3. You are taken to the work's detail page: the framed painting with numbered,
   hover-synced bounding boxes, the catalogue of detected objects, and the
   extracted color palette.
4. Browse every analysed work from the **Collection** menu.

## API

| Method | Path                   | Description                              |
| ------ | ---------------------- | ---------------------------------------- |
| `POST` | `/api/paintings`       | multipart upload → analyse & store       |
| `GET`  | `/api/paintings`       | list analysed paintings (summaries)      |
| `GET`  | `/api/paintings/{id}`  | full detail (objects + palette)          |
| `GET`  | `/images/{filename}`   | stored image bytes                       |

## Notes

- Single-user local app: no authentication or pagination (easy to add later
  behind the repository interface).
- Bounding boxes are stored in image-pixel space; the painting's width/height are
  persisted so the frontend overlay aligns at any rendered size.
- To swap color extraction (e.g. for `colorthief` or k-means), implement
  `PaletteExtractor` and wire it in `app/api/dependencies.py` — nothing else changes.
