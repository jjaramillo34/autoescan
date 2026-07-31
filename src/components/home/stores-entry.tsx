import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { SECTORES_AMBATO } from "@/lib/constants";

export function StoresEntry() {
  const preview = SECTORES_AMBATO.slice(0, 4);

  return (
    <section
      className="flex flex-col gap-4 border-y border-border/50 py-6 sm:flex-row sm:items-end sm:justify-between"
      aria-labelledby="tiendas-entry-title"
    >
      <div className="space-y-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Store className="size-3.5 text-accent" />
          Locales reales
        </p>
        <h2
          id="tiendas-entry-title"
          className="font-heading text-2xl tracking-wide sm:text-3xl"
        >
          Tiendas en Ambato
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Recorre locales por sector — {preview.join(", ")}
          {SECTORES_AMBATO.length > preview.length ? "…" : ""}.
        </p>
      </div>
      <Link
        href="/tiendas"
        className="inline-flex items-center gap-2 self-start font-heading text-base tracking-wide text-primary transition-colors hover:text-primary/80 sm:self-auto"
      >
        Ver todas las tiendas
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
