"use server";

import { getPartsByIds } from "@/lib/parts-service";

export async function fetchSavedPartsAction(ids: string[]) {
  const clean = ids.filter((id) => typeof id === "string" && id.length > 0).slice(0, 50);
  if (clean.length === 0) return [];
  return getPartsByIds(clean);
}
