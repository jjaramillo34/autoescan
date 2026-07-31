"use client";

import { createContext, useContext } from "react";

const FavoritesUserContext = createContext<string | null>(null);

export function FavoritesUserProvider({
  userId,
  children,
}: {
  userId?: string | null;
  children: React.ReactNode;
}) {
  return (
    <FavoritesUserContext.Provider value={userId ?? null}>
      {children}
    </FavoritesUserContext.Provider>
  );
}

export function useFavoritesUserId() {
  return useContext(FavoritesUserContext);
}
