"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIAS, MARCAS_COMUNES } from "@/lib/constants";

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
  { value: "recientes", label: "Más recientes" },
] as const;

export function PartFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/?${qs}#catalogo` : "/#catalogo");
  }

  function updateParam(key: string, value: string) {
    pushParams((params) => {
      if (!value || value === "todas" || value === "todas-marcas") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const q = String(form.get("q") ?? "").trim();
    const minPrice = String(form.get("minPrice") ?? "").trim();
    const maxPrice = String(form.get("maxPrice") ?? "").trim();
    pushParams((params) => {
      if (q) params.set("q", q);
      else params.delete("q");
      if (minPrice) params.set("minPrice", minPrice);
      else params.delete("minPrice");
      if (maxPrice) params.set("maxPrice", maxPrice);
      else params.delete("maxPrice");
    });
  }

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const activeChips = [
    searchParams.get("q") && {
      key: "q",
      label: `“${searchParams.get("q")}”`,
    },
    searchParams.get("brand") && {
      key: "brand",
      label: searchParams.get("brand")!,
    },
    searchParams.get("model") && {
      key: "model",
      label: searchParams.get("model")!,
    },
    searchParams.get("year") && {
      key: "year",
      label: `Año ${searchParams.get("year")}`,
    },
    searchParams.get("category") && {
      key: "category",
      label: searchParams.get("category")!,
    },
    searchParams.get("location") && {
      key: "location",
      label: searchParams.get("location")!,
    },
    (minPrice || maxPrice) && {
      key: "price",
      label: `$${minPrice || "0"} – $${maxPrice || "∞"}`,
    },
    searchParams.get("seller") && {
      key: "seller",
      label: "Tienda",
    },
  ].filter(Boolean) as { key: string; label: string }[];

  function clearChip(key: string) {
    if (key === "price") {
      pushParams((params) => {
        params.delete("minPrice");
        params.delete("maxPrice");
      });
      return;
    }
    updateParam(key, "");
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Ej. pastillas, GDB1330, sensor MAF..."
              defaultValue={searchParams.get("q") ?? ""}
              className="pl-9"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Select
              value={searchParams.get("brand") ?? "todas-marcas"}
              onValueChange={(v) => updateParam("brand", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas-marcas">Todas</SelectItem>
                {MARCAS_COMUNES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              placeholder="Ej. Aveo, Yaris"
              defaultValue={searchParams.get("model") ?? ""}
              onBlur={(e) => updateParam("model", e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  updateParam(
                    "model",
                    (e.target as HTMLInputElement).value.trim(),
                  );
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year">Año</Label>
            <Input
              id="year"
              type="number"
              placeholder="Ej. 2018"
              min={1990}
              max={2030}
              defaultValue={searchParams.get("year") ?? ""}
              onBlur={(e) => updateParam("year", e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  updateParam(
                    "year",
                    (e.target as HTMLInputElement).value.trim(),
                  );
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select
              value={searchParams.get("category") ?? "todas"}
              onValueChange={(v) => updateParam("category", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Ordenar</Label>
            <Select
              value={searchParams.get("sort") ?? "relevancia"}
              onValueChange={(v) =>
                updateParam("sort", v === "relevancia" ? "" : (v ?? ""))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Relevancia" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="minPrice">Precio mín. (USD)</Label>
            <Input
              id="minPrice"
              name="minPrice"
              type="number"
              min={0}
              step="1"
              placeholder="0"
              defaultValue={minPrice ?? ""}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxPrice">Precio máx. (USD)</Label>
            <Input
              id="maxPrice"
              name="maxPrice"
              type="number"
              min={0}
              step="1"
              placeholder="Ej. 100"
              defaultValue={maxPrice ?? ""}
              inputMode="decimal"
            />
          </div>
        </div>
      </form>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => clearChip(chip.key)}
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs hover:border-primary/40"
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.push("/#catalogo")}
            className="text-xs text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
