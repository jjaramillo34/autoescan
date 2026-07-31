"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavoritesUserId } from "@/components/favorites/favorites-user";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import {
  isPartSaved,
  toggleSavedPart,
  writeSavedPartIds,
} from "@/lib/saved-parts";
import { cn } from "@/lib/utils";

interface SavePartButtonProps {
  partId: string;
  partTitle?: string;
  sellerId?: string;
  brand?: string;
  model?: string;
  location?: string;
  className?: string;
  variant?: "icon" | "button";
}

export function SavePartButton({
  partId,
  partTitle,
  sellerId,
  brand,
  model,
  location,
  className,
  variant = "icon",
}: SavePartButtonProps) {
  const userId = useFavoritesUserId();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isPartSaved(partId));
    sync();
    window.addEventListener("autoescan:saved-parts", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("autoescan:saved-parts", sync);
      window.removeEventListener("storage", sync);
    };
  }, [partId]);

  async function onToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (userId) {
      const result = await toggleFavoriteAction(partId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      writeSavedPartIds(result.ids);
      setSaved(result.saved);
      if (result.saved) {
        void fetch("/api/analytics/favorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partId,
            sellerId,
            query: partTitle,
            brand,
            model,
            location,
            saved: true,
          }),
          keepalive: true,
        });
      }
      toast.success(
        result.saved ? "Guardado en tu cuenta" : "Quitado de favoritos",
        {
          description: partTitle,
          action: result.saved
            ? {
                label: "Ver",
                onClick: () => {
                  window.location.href = "/guardados";
                },
              }
            : undefined,
        },
      );
      return;
    }

    const next = toggleSavedPart(partId);
    setSaved(next);
    if (next) {
      void fetch("/api/analytics/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId,
          sellerId,
          query: partTitle,
          brand,
          model,
          location,
          saved: true,
        }),
        keepalive: true,
      });
    }
    toast.success(
      next ? "Guardado en favoritos" : "Quitado de favoritos",
      {
        description: partTitle,
        action: next
          ? {
              label: "Ver",
              onClick: () => {
                window.location.href = "/guardados";
              },
            }
          : undefined,
      },
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={(e) => void onToggle(e)}
        className={cn(
          "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-background text-sm font-medium transition-colors hover:border-primary/40",
          saved && "border-primary/40 bg-primary/10 text-primary",
          className,
        )}
      >
        <Heart className={cn("size-3.5", saved && "fill-current")} />
        {saved ? "Guardado" : "Guardar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => void onToggle(e)}
      aria-label={saved ? "Quitar de guardados" : "Guardar repuesto"}
      aria-pressed={saved}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60",
        saved && "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      <Heart className={cn("size-3.5", saved && "fill-current")} />
    </button>
  );
}
