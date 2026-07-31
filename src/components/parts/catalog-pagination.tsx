"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export function CatalogPagination({
  page,
  totalPages,
  total,
}: CatalogPaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/?${qs}#catalogo` : "/#catalogo";
  }

  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  );

  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-4 sm:flex-row"
      aria-label="Paginación del catálogo"
    >
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages} · {total} repuestos
      </p>
      <div className="flex items-center gap-1">
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page <= 1}
          className={page <= 1 ? "pointer-events-none opacity-40" : ""}
        >
          <Link href={hrefFor(page - 1)} scroll={false}>
            <ChevronLeft className="size-4" />
            Anterior
          </Link>
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            asChild
            variant={p === page ? "default" : "outline"}
            size="sm"
            className="min-w-9"
          >
            <Link href={hrefFor(p)} scroll={false}>
              {p}
            </Link>
          </Button>
        ))}
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
        >
          <Link href={hrefFor(page + 1)} scroll={false}>
            Siguiente
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </nav>
  );
}
