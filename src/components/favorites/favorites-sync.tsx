"use client";

import { useEffect, useRef } from "react";
import { syncFavoritesAction } from "@/lib/actions/favorites";
import {
  readSavedPartIds,
  writeSavedPartIds,
} from "@/lib/saved-parts";

/** Fusiona favoritos localStorage ↔ cuenta al iniciar sesión. */
export function FavoritesSync({ userId }: { userId?: string | null }) {
  const done = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || done.current === userId) return;
    done.current = userId;
    const local = readSavedPartIds();
    void syncFavoritesAction(local).then((res) => {
      if (res.ok) writeSavedPartIds(res.ids);
    });
  }, [userId]);

  return null;
}
