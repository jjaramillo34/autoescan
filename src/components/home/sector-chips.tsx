"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { SECTORES_AMBATO } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SectorChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("location");

  function select(sector: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!sector) params.delete("location");
    else params.set("location", sector);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/?${qs}#catalogo` : "/#catalogo");
  }

  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <MapPin className="size-3.5 text-accent" />
        Cerca de ti · sectores de Ambato
      </p>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => select(null)}
          className={cn(
            "shrink-0 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
            !active
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/70 bg-card hover:border-primary/30",
          )}
        >
          Todos
        </button>
        {SECTORES_AMBATO.map((sector) => {
          const isActive = active === sector;
          return (
            <button
              key={sector}
              type="button"
              onClick={() => select(isActive ? null : sector)}
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-card hover:border-primary/30",
              )}
            >
              {sector}
            </button>
          );
        })}
      </div>
    </div>
  );
}
