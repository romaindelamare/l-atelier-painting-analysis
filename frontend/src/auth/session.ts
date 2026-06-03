// Token persistence for the single-user session. Kept in localStorage so a page
// reload stays logged in. Both the API client (which rotates tokens on refresh)
// and the React AuthContext read/write through here; subscribers are notified on
// every change so the UI reacts when tokens are set or cleared anywhere.

const ACCESS_KEY = "atelier.access";
const REFRESH_KEY = "atelier.refresh";

type Listener = () => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setSession(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  emit();
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener());
}
