"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESPECIALIZACIONES, SECTORES_AMBATO } from "@/lib/constants";

export function StoresFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function push(mutate: (p: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    router.push(qs ? `/tiendas?${qs}` : "/tiendas");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="relative sm:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          key={searchParams.get("q") ?? ""}
          name="q"
          placeholder="Buscar tienda…"
          defaultValue={searchParams.get("q") ?? ""}
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const value = (e.target as HTMLInputElement).value.trim();
              push((p) => {
                if (value) p.set("q", value);
                else p.delete("q");
              });
            }
          }}
          onBlur={(e) => {
            const value = e.target.value.trim();
            const current = searchParams.get("q") ?? "";
            if (value === current) return;
            push((p) => {
              if (value) p.set("q", value);
              else p.delete("q");
            });
          }}
        />
      </div>

      <Select
        value={searchParams.get("sector") ?? "todos"}
        onValueChange={(v) =>
          push((p) => {
            if (!v || v === "todos") p.delete("sector");
            else p.set("sector", v);
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sector" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los sectores</SelectItem>
          {SECTORES_AMBATO.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("spec") ?? "todas"}
        onValueChange={(v) =>
          push((p) => {
            if (!v || v === "todas") p.delete("spec");
            else p.set("spec", v);
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Especialización" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las especializaciones</SelectItem>
          {ESPECIALIZACIONES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
