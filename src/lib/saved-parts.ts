export const SAVED_PARTS_KEY = "autoescan:guardados";

export function readSavedPartIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_PARTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function writeSavedPartIds(ids: string[]) {
  if (typeof window === "undefined") return;
  const unique = [...new Set(ids)].slice(0, 100);
  localStorage.setItem(SAVED_PARTS_KEY, JSON.stringify(unique));
  window.dispatchEvent(new Event("autoescan:saved-parts"));
}

export function isPartSaved(id: string): boolean {
  return readSavedPartIds().includes(id);
}

export function toggleSavedPart(id: string): boolean {
  const ids = readSavedPartIds();
  const exists = ids.includes(id);
  writeSavedPartIds(exists ? ids.filter((x) => x !== id) : [id, ...ids]);
  return !exists;
}
