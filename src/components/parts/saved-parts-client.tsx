"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { PartCard } from "@/components/parts/part-card";
import { Button } from "@/components/ui/button";
import { fetchSavedPartsAction } from "@/lib/actions/saved-parts";
import { readSavedPartIds } from "@/lib/saved-parts";
import type { PartDTO } from "@/lib/types";

export function SavedPartsClient() {
  const [parts, setParts] = useState<PartDTO[] | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    const ids = readSavedPartIds();
    if (ids.length === 0) {
      setParts([]);
      return;
    }
    startTransition(async () => {
      const result = await fetchSavedPartsAction(ids);
      setParts(result);
    });
  }

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("autoescan:saved-parts", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("autoescan:saved-parts", onChange);
      window.removeEventListener("storage", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (parts === null || pending) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando guardados…
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 px-6 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Heart className="size-6" />
        </div>
        <p className="font-heading text-2xl tracking-wide">Sin favoritos aún</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Toca el corazón en cualquier repuesto para guardarlo aquí.
        </p>
        <Button asChild className="mt-6">
          <Link href="/#catalogo">Explorar catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {parts.length} repuesto{parts.length === 1 ? "" : "s"} guardado
        {parts.length === 1 ? "" : "s"}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parts.map((part, index) => (
          <PartCard key={part._id} part={part} index={index} />
        ))}
      </div>
    </div>
  );
}
