"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import {
  isPartSaved,
  toggleSavedPart,
} from "@/lib/saved-parts";
import { cn } from "@/lib/utils";

interface SavePartButtonProps {
  partId: string;
  partTitle?: string;
  className?: string;
  /** Compact icon for cards */
  variant?: "icon" | "button";
}

export function SavePartButton({
  partId,
  partTitle,
  className,
  variant = "icon",
}: SavePartButtonProps) {
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

  function onToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleSavedPart(partId);
    setSaved(next);
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
        onClick={onToggle}
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
      onClick={onToggle}
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
