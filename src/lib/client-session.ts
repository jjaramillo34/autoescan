/** ID anónimo del navegador para analytics (no PII). */

const STORAGE_KEY = "ae_session_id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ae_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateClientSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = randomId();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}
