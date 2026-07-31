"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Car, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MARCAS_COMUNES } from "@/lib/constants";
import {
  formatVehicleLabel,
  readSavedVehicle,
  writeSavedVehicle,
  type SavedVehicle,
} from "@/lib/vehicle";

export function VehicleBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicle, setVehicle] = useState<SavedVehicle | null>(null);
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    const sync = () => setVehicle(readSavedVehicle());
    sync();
    window.addEventListener("autoescan:vehicle", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("autoescan:vehicle", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function openEditor(next?: SavedVehicle | null) {
    const v = next ?? vehicle;
    setBrand(v?.brand ?? "");
    setModel(v?.model ?? "");
    setYear(v?.year ?? "");
    setOpen(true);
  }

  function applyToCatalog(v: SavedVehicle) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("brand", v.brand);
    if (v.model) params.set("model", v.model);
    else params.delete("model");
    if (v.year) params.set("year", v.year);
    else params.delete("year");
    params.delete("page");
    router.push(`/?${params.toString()}#catalogo`);
  }

  function save() {
    if (!brand.trim()) {
      toast.error("Elige la marca de tu vehículo");
      return;
    }
    const next: SavedVehicle = {
      brand: brand.trim(),
      model: model.trim(),
      year: year.trim(),
    };
    writeSavedVehicle(next);
    setVehicle(next);
    setOpen(false);
    applyToCatalog(next);
    toast.success("Vehículo guardado", {
      description: `Buscando repuestos para ${formatVehicleLabel(next)}`,
    });
  }

  function clearVehicle() {
    writeSavedVehicle(null);
    setVehicle(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brand");
    params.delete("model");
    params.delete("year");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/?${qs}#catalogo` : "/#catalogo");
  }

  return (
    <>
      <div className="sticky top-14 z-30 -mx-4 border-y border-border/50 bg-background/85 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border">
        {vehicle ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Car className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Mi vehículo
                </p>
                <p className="truncate font-heading text-lg leading-tight tracking-wide">
                  {formatVehicleLabel(vehicle)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => applyToCatalog(vehicle)}
              >
                Filtrar catálogo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => openEditor()}
              >
                <Pencil className="size-3.5" />
                Editar
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={clearVehicle}
                aria-label="Quitar vehículo"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Car className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">¿Qué vehículo tienes?</p>
                <p className="text-xs text-muted-foreground">
                  Guárdalo y el catálogo prioriza piezas compatibles.
                </p>
              </div>
            </div>
            <Button type="button" size="sm" onClick={() => openEditor(null)}>
              Configurar
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mi vehículo</DialogTitle>
            <DialogDescription>
              Lo guardamos en este dispositivo para filtrar el catálogo más
              rápido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Select value={brand} onValueChange={(v) => setBrand(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona marca" />
                </SelectTrigger>
                <SelectContent>
                  {MARCAS_COMUNES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-model">Modelo</Label>
              <Input
                id="vehicle-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej. Tucson, Aveo, Corolla"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-year">Año</Label>
              <Input
                id="vehicle-year"
                type="number"
                min={1990}
                max={2030}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ej. 2018"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={save}>
              Guardar y filtrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
