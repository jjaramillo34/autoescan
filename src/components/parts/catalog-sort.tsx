"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio_asc", label: "Precio ↑" },
  { value: "precio_desc", label: "Precio ↓" },
  { value: "recientes", label: "Más recientes" },
] as const;

export function CatalogSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "relevancia";

  function onChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "relevancia") params.delete("sort");
    else params.set("sort", value);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/?${qs}#catalogo` : "/#catalogo");
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        Ordenar
      </span>
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[150px] sm:w-[170px]" aria-label="Ordenar">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
