// Thin typed wrapper over the backend REST API. URLs are relative so the Vite
// dev proxy (and a same-origin production deploy) route them to FastAPI.

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from "../auth/session";
import type {
  ElementCreate,
  ElementUpdate,
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

// --- Authentication ------------------------------------------------------------

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function login(password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const tokens = await handle<TokenResponse>(res);
  setSession(tokens.access_token, tokens.refresh_token);
}

export async function logout(): Promise<void> {
  const refresh_token = getRefreshToken();
  if (refresh_token) {
    // Best-effort server-side revocation; clear locally regardless.
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    }).catch(() => undefined);
  }
  clearSession();
}

export async function logoutEverywhere(): Promise<void> {
  await authFetch("/api/auth/logout-all", { method: "POST" }).catch(
    () => undefined,
  );
  clearSession();
}

export async function checkAuth(): Promise<boolean> {
  if (!getAccessToken()) return false;
  try {
    const res = await authFetch("/api/auth/me");
    return res.ok;
  } catch {
    return false;
  }
}

// Single-flight refresh so concurrent 401s don't each spend the refresh token.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh_token = getRefreshToken();
    if (!refresh_token) return false;
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });
    if (!res.ok) {
      clearSession();
      return false;
    }
    const tokens = (await res.json()) as TokenResponse;
    setSession(tokens.access_token, tokens.refresh_token);
    return true;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

// Authenticated fetch: attaches the bearer token and, on a 401, transparently
// refreshes once and retries. A persistent 401 clears the session so the UI can
// redirect to login.
async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (token: string | null): RequestInit => ({
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let res = await fetch(input, withAuth(getAccessToken()));
  if (res.status === 401 && (await refreshAccessToken())) {
    res = await fetch(input, withAuth(getAccessToken()));
  }
  return res;
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

  return handle(await authFetch("/api/paintings", { method: "POST", body: form }));
}

export async function updatePainting(
  id: number,
  meta: UploadMetadata,
): Promise<PaintingDetail> {
  return handle(
    await authFetch(`/api/paintings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    }),
  );
}

export async function deletePainting(id: number): Promise<void> {
  const response = await authFetch(`/api/paintings/${id}`, { method: "DELETE" });
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

// --- Element curation (auth-only) — each returns the refreshed painting ---------

function elementsBase(paintingId: number): string {
  return `/api/paintings/${paintingId}/elements`;
}

async function jsonAuth<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  return handle<T>(
    await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
  );
}

export async function createElement(
  paintingId: number,
  body: ElementCreate,
): Promise<PaintingDetail> {
  return jsonAuth(elementsBase(paintingId), "POST", body);
}

export async function updateElement(
  paintingId: number,
  elementId: number,
  body: ElementUpdate,
): Promise<PaintingDetail> {
  return jsonAuth(`${elementsBase(paintingId)}/${elementId}`, "PATCH", body);
}

export async function deleteElement(
  paintingId: number,
  elementId: number,
): Promise<PaintingDetail> {
  return jsonAuth(`${elementsBase(paintingId)}/${elementId}`, "DELETE");
}

export async function bulkDeleteElements(
  paintingId: number,
  ids: number[],
): Promise<PaintingDetail> {
  return jsonAuth(`${elementsBase(paintingId)}/bulk-delete`, "POST", { ids });
}

export async function renumberElements(
  paintingId: number,
): Promise<PaintingDetail> {
  return jsonAuth(`${elementsBase(paintingId)}/renumber`, "POST");
}

export async function revertElements(
  paintingId: number,
): Promise<PaintingDetail> {
  return jsonAuth(`${elementsBase(paintingId)}/revert`, "POST");
}

export async function reanalyzePalette(
  paintingId: number,
): Promise<PaintingDetail> {
  return jsonAuth(`/api/paintings/${paintingId}/palette`, "POST");
}
