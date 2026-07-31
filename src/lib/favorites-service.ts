import mongoose from "mongoose";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { SavedFavorite } from "@/lib/models/SavedFavorite";

const demoFavorites = new Map<string, string[]>();

function cleanIds(ids: string[]) {
  return [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0))].slice(
    0,
    100,
  );
}

export async function getFavoriteIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  if (!isDatabaseConfigured()) {
    return demoFavorites.get(userId) ?? [];
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) return [];
  await connectDB();
  const row = await SavedFavorite.findOne({ user: userId }).lean();
  return (row?.partIds ?? []).map((id) => String(id));
}

export async function setFavoriteIds(
  userId: string,
  ids: string[],
): Promise<string[]> {
  const clean = cleanIds(ids);
  if (!userId) return [];

  if (!isDatabaseConfigured()) {
    demoFavorites.set(userId, clean);
    return clean;
  }

  await connectDB();
  const objectIds = clean
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  await SavedFavorite.findOneAndUpdate(
    { user: userId },
    { $set: { partIds: objectIds } },
    { upsert: true, new: true },
  );
  return objectIds.map((id) => String(id));
}

/** Une locales + servidor (locales primero). */
export async function mergeFavoriteIds(
  userId: string,
  localIds: string[],
): Promise<string[]> {
  const server = await getFavoriteIds(userId);
  return setFavoriteIds(userId, [...localIds, ...server]);
}

export async function toggleFavoriteId(
  userId: string,
  partId: string,
): Promise<{ saved: boolean; ids: string[] }> {
  const current = await getFavoriteIds(userId);
  const exists = current.includes(partId);
  const next = exists
    ? current.filter((id) => id !== partId)
    : [partId, ...current];
  const ids = await setFavoriteIds(userId, next);
  return { saved: !exists, ids };
}
