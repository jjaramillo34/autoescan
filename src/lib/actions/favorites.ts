"use server";

import { auth } from "@/auth";
import {
  getFavoriteIds,
  mergeFavoriteIds,
  toggleFavoriteId,
} from "@/lib/favorites-service";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

export async function getMyFavoriteIdsAction() {
  const userId = await requireUserId();
  if (!userId) return [] as string[];
  return getFavoriteIds(userId);
}

export async function syncFavoritesAction(localIds: string[]) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, ids: [] as string[] };
  const ids = await mergeFavoriteIds(userId, localIds);
  return { ok: true as const, ids };
}

export async function toggleFavoriteAction(partId: string) {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false as const, error: "Inicia sesión para sincronizar." };
  }
  if (!partId) {
    return { ok: false as const, error: "Falta el producto." };
  }
  const result = await toggleFavoriteId(userId, partId);
  return { ok: true as const, ...result };
}
