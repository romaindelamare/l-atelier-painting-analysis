// Thin typed wrapper over the backend REST API. URLs are relative so the Vite
// dev proxy (and a same-origin production deploy) route them to FastAPI.

import type {
  PaintingDetail,
  PaintingSummary,
  UploadMetadata,
} from "../types/painting";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export function imageUrl(filename: string): string {
  return `/images/${filename}`;
}

export async function listPaintings(): Promise<PaintingSummary[]> {
  return handle(await fetch("/api/paintings"));
}

export async function getPainting(id: number): Promise<PaintingDetail> {
  return handle(await fetch(`/api/paintings/${id}`));
}

export async function uploadPainting(
  file: File,
  meta: UploadMetadata,
): Promise<PaintingDetail> {
  const form = new FormData();
  form.append("file", file);
  if (meta.title) form.append("title", meta.title);
  if (meta.artist) form.append("artist", meta.artist);
  if (meta.year) form.append("year", meta.year);
  if (meta.notes) form.append("notes", meta.notes);
  if (meta.location_owner) form.append("location_owner", meta.location_owner);
  if (meta.location_city) form.append("location_city", meta.location_city);
  if (meta.location_country) form.append("location_country", meta.location_country);

  return handle(await fetch("/api/paintings", { method: "POST", body: form }));
}

export async function updatePainting(
  id: number,
  meta: UploadMetadata,
): Promise<PaintingDetail> {
  return handle(
    await fetch(`/api/paintings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    }),
  );
}

export async function deletePainting(id: number): Promise<void> {
  const response = await fetch(`/api/paintings/${id}`, { method: "DELETE" });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
}
