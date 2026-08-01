"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Car, MapPin, Search } from "lucide-react";
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
import { MARCAS_COMUNES, SECTORES_AMBATO } from "@/lib/constants";
import {
  formatVehicleLabel,
  readSavedVehicle,
  writeSavedVehicle,
} from "@/lib/vehicle";

export function HomeSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [brand, setBrand] = useState(searchParams.get("brand") ?? "");
  const [model, setModel] = useState(searchParams.get("model") ?? "");
  const [savedLabel, setSavedLabel] = useState<string | null>(null);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setLocation(searchParams.get("location") ?? "");
    setBrand(searchParams.get("brand") ?? "");
    setModel(searchParams.get("model") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const sync = () => {
      const v = readSavedVehicle();
      setSavedLabel(v ? formatVehicleLabel(v) : null);
      if (v && !searchParams.get("brand")) {
        setBrand((b) => b || v.brand);
        setModel((m) => m || v.model || "");
      }
    };
    sync();
    window.addEventListener("autoescan:vehicle", sync);
    return () => window.removeEventListener("autoescan:vehicle", sync);
  }, [searchParams]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (location) params.set("location", location);
    if (brand) params.set("brand", brand);
    if (model.trim()) params.set("model", model.trim());
    const qs = params.toString();
    router.push(qs ? `/?${qs}#catalogo` : "/#catalogo");
  }

  function saveVehicle() {
    if (!brand) {
      toast.error("Elige la marca para guardar tu vehículo");
      return;
    }
    const next = {
      brand,
      model: model.trim(),
      year: searchParams.get("year") ?? "",
    };
    writeSavedVehicle(next);
    setSavedLabel(formatVehicleLabel(next));
    toast.success("Vehículo guardado", {
      description: formatVehicleLabel(next),
    });
  }

  return (
    <section
      className="relative z-20 -mt-6 space-y-3 sm:-mt-10"
      aria-label="Buscar repuestos"
    >
      <form
        onSubmit={submit}
        className="rounded-2xl border border-border/60 bg-background/95 p-3 shadow-[0_18px_50px_-28px_oklch(0.35_0.08_45/0.55)] backdrop-blur-md sm:p-4"
      >
        <div className="grid gap-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="¿Qué buscas? pastillas, sensor, código…"
              className="h-11 border-border/50 bg-card/40 pl-9"
              aria-label="Qué buscas"
            />
          </div>

          <Select
            value={location || "todos"}
            onValueChange={(v) => setLocation(!v || v === "todos" ? "" : v)}
          >
            <SelectTrigger className="h-11 w-full border-border/50 bg-card/40">
              <span className="flex items-center gap-2 truncate">
                <MapPin className="size-3.5 shrink-0 text-accent" />
                <SelectValue placeholder="Sector Ambato" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo Ambato</SelectItem>
              {SECTORES_AMBATO.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={brand || "todas"}
            onValueChange={(v) => setBrand(!v || v === "todas" ? "" : v)}
          >
            <SelectTrigger className="h-11 w-full border-border/50 bg-card/40">
              <span className="flex items-center gap-2 truncate">
                <Car className="size-3.5 shrink-0 text-primary" />
                <SelectValue placeholder="Marca" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las marcas</SelectItem>
              {MARCAS_COMUNES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Modelo (Aveo, Yaris…)"
            className="h-11 border-border/50 bg-card/40"
            aria-label="Modelo"
          />

          <Button type="submit" size="lg" className="h-11 gap-2 px-6">
            <Search className="size-4" />
            Buscar
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href="/buscar-por-imagen"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <Camera className="size-3.5" />
              Mejor por foto
            </Link>
            {savedLabel ? (
              <span className="inline-flex items-center gap-1">
                <Car className="size-3.5" />
                Mi vehículo: {savedLabel}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={saveVehicle}
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Guardar marca/modelo como mi vehículo
          </button>
        </div>
      </form>
    </section>
  );
}
