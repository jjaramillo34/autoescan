"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryTable } from "@/components/seller/inventory-table";
import { INVENTORY_PAGE_SIZE } from "@/lib/constants";
import { getStockStatus, type PartDTO, type StockStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type StockFilter = "todos" | StockStatus | "archivados";
type InventorySort =
  | "recientes"
  | "titulo"
  | "precio_asc"
  | "precio_desc"
  | "stock_asc"
  | "stock_desc"
  | "codigo";

interface InventoryPanelProps {
  parts: PartDTO[];
}

function matchesQuery(part: PartDTO, q: string) {
  if (!q) return true;
  const haystack = [
    part.title,
    part.partBrand,
    part.partCode,
    part.brand,
    part.model,
    part.yearRange,
    part.category,
    part.location,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function exportCsv(parts: PartDTO[]) {
  const header = [
    "titulo",
    "marca_repuesto",
    "codigo",
    "marca_vehiculo",
    "modelo",
    "anios",
    "categoria",
    "precio",
    "stock",
    "sector",
  ];
  const rows = parts.map((p) =>
    [
      p.title,
      p.partBrand ?? "",
      p.partCode ?? "",
      p.brand,
      p.model,
      p.yearRange,
      p.category,
      p.price.toFixed(2),
      String(p.stockQuantity),
      p.location,
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario-autoescan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function InventoryPanel({ parts }: InventoryPanelProps) {
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("todos");
  const [sort, setSort] = useState<InventorySort>("recientes");
  const [page, setPage] = useState(1);
  const q = query.trim().toLowerCase();

  const stats = useMemo(() => {
    let disponibles = 0;
    let ultimas = 0;
    let agotados = 0;
    let archivados = 0;
    for (const p of parts) {
      if (p.isArchived) {
        archivados += 1;
        continue;
      }
      const status = getStockStatus(p.stockQuantity);
      if (status === "disponible") disponibles += 1;
      else if (status === "ultimas") ultimas += 1;
      else agotados += 1;
    }
    return {
      disponibles,
      ultimas,
      agotados,
      archivados,
      total: parts.length,
    };
  }, [parts]);

  const filtered = useMemo(() => {
    let list = parts.filter((p) => {
      if (!matchesQuery(p, q)) return false;
      if (stockFilter === "archivados") return Boolean(p.isArchived);
      if (p.isArchived) return false;
      if (stockFilter === "todos") return true;
      return getStockStatus(p.stockQuantity) === stockFilter;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "titulo":
          return a.title.localeCompare(b.title, "es");
        case "precio_asc":
          return a.price - b.price;
        case "precio_desc":
          return b.price - a.price;
        case "stock_asc":
          return a.stockQuantity - b.stockQuantity;
        case "stock_desc":
          return b.stockQuantity - a.stockQuantity;
        case "codigo":
          return (a.partCode ?? "").localeCompare(b.partCode ?? "", "es");
        case "recientes":
        default:
          return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      }
    });

    return list;
  }, [parts, q, stockFilter, sort]);

  const pageSize = INVENTORY_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  function setFilter(next: StockFilter) {
    setStockFilter(next);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            {
              key: "disponible" as const,
              label: "Disponibles",
              value: stats.disponibles,
              active:
                "border-emerald-500/50 bg-emerald-500/20 ring-1 ring-emerald-500/30",
              idle: "border-emerald-500/20 bg-emerald-500/10",
              text: "text-emerald-700 dark:text-emerald-300",
            },
            {
              key: "ultimas" as const,
              label: "Últimas unidades",
              value: stats.ultimas,
              active:
                "border-amber-500/50 bg-amber-500/20 ring-1 ring-amber-500/30",
              idle: "border-amber-500/20 bg-amber-500/10",
              text: "text-amber-700 dark:text-amber-300",
            },
            {
              key: "agotado" as const,
              label: "Agotados",
              value: stats.agotados,
              active: "border-red-500/50 bg-red-500/20 ring-1 ring-red-500/30",
              idle: "border-red-500/20 bg-red-500/10",
              text: "text-red-700 dark:text-red-300",
            },
          ] as const
        ).map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() =>
              setFilter(stockFilter === card.key ? "todos" : card.key)
            }
            className={cn(
              "rounded-xl border px-3 py-3 text-center transition-colors",
              stockFilter === card.key ? card.active : card.idle,
            )}
          >
            <p className={cn("text-2xl font-semibold", card.text)}>
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por título, código, marca…"
            className="pl-9"
            aria-label="Buscar en inventario"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as InventorySort);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recientes">Más recientes</SelectItem>
            <SelectItem value="titulo">Título A–Z</SelectItem>
            <SelectItem value="codigo">Código A–Z</SelectItem>
            <SelectItem value="precio_asc">Precio: menor</SelectItem>
            <SelectItem value="precio_desc">Precio: mayor</SelectItem>
            <SelectItem value="stock_asc">Stock: menor</SelectItem>
            <SelectItem value="stock_desc">Stock: mayor</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            exportCsv(filtered);
            toast.success("CSV exportado", {
              description: `${filtered.length} producto(s)`,
            });
          }}
          disabled={filtered.length === 0}
        >
          <Download className="size-4" />
          Exportar
        </Button>
      </div>

      {(q || stockFilter !== "todos") && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            Mostrando {filtered.length} de {stats.total}
            {stockFilter !== "todos" ? ` · filtro ${stockFilter}` : ""}
            {q ? ` · “${query.trim()}”` : ""}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2"
            onClick={() => {
              setQuery("");
              setStockFilter("todos");
              setPage(1);
            }}
          >
            <X className="size-3.5" />
            Limpiar
          </Button>
        </div>
      )}

      {stats.archivados > 0 && stockFilter !== "archivados" && (
        <button
          type="button"
          onClick={() => setFilter("archivados")}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Ver {stats.archivados} archivado{stats.archivados === 1 ? "" : "s"}
        </button>
      )}

      <InventoryTable
        parts={pageItems}
        emptyLabel={
          parts.length === 0
            ? undefined
            : "Ningún repuesto coincide con la búsqueda o el filtro."
        }
      />

      {filtered.length > 0 && (
        <nav
          className="flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-4 sm:flex-row"
          aria-label="Paginación del inventario"
        >
          <p className="text-xs text-muted-foreground">
            Página {safePage} de {totalPages} · {filtered.length} repuestos
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="min-w-16 px-2 text-center text-sm tabular-nums">
              {safePage}/{totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
