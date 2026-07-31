"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Car, MapPin, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyParts() {
  const searchParams = useSearchParams();
  const brand = searchParams.get("brand");
  const model = searchParams.get("model");
  const location = searchParams.get("location");
  const vehicleHint = [brand, model].filter(Boolean).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 bg-card/30 px-6 py-14 text-center"
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <PackageSearch className="size-7" />
      </div>
      <p className="font-heading text-2xl tracking-wide">
        No encontramos repuestos
      </p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Prueba ampliar la búsqueda, cambiar de sector o identificar la pieza con
        una foto.
      </p>

      {(vehicleHint || location) && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          {vehicleHint && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2.5 py-1">
              <Car className="size-3.5 text-primary" />
              {vehicleHint}
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2.5 py-1">
              <MapPin className="size-3.5 text-accent" />
              {location}
            </span>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="secondary">
          <Link href="/#catalogo">Limpiar filtros</Link>
        </Button>
        <Button asChild className="gap-2">
          <Link href="/buscar-por-imagen">
            <Camera className="size-4" />
            Buscar por foto
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
