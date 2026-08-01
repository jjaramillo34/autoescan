"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Car,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrCreateClientSessionId } from "@/lib/client-session";
import { PhotoGuide } from "@/components/ai/photo-guide";
import { MARCAS_COMUNES } from "@/lib/constants";
import type { IdentifyPartResult } from "@/lib/types";

export function ImageSearch() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [result, setResult] = useState<
    (IdentifyPartResult & { demo?: boolean }) | null
  >(null);
  const [activePiece, setActivePiece] = useState<string | null>(null);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Archivo no válido", {
          description: "Sube una foto (JPG, PNG o WEBP).",
        });
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        toast.error("Foto muy pesada", {
          description: "Máximo 8 MB. Baja la calidad o elige otra imagen.",
        });
        return;
      }

      if (!brand) {
        toast.message("Elige la marca del auto primero", {
          description:
            "Así el resultado se filtra a piezas compatibles con tu vehículo.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => setPreview(String(reader.result));
      reader.readAsDataURL(file);

      setLoading(true);
      setResult(null);
      setActivePiece(null);
      setExcludedKeywords([]);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/ai/identify-part", {
          method: "POST",
          body: formData,
          headers: {
            "x-session-id": getOrCreateClientSessionId(),
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Error al analizar la imagen");
        }

        setResult(data);
        setActivePiece(data.pieza);

        if (data.demo) {
          toast.message("Modo demo de IA", {
            description:
              "Configura GOOGLE_GEMINI_API_KEY para reconocimiento real.",
          });
        } else {
          toast.success("Pieza identificada");
        }
      } catch (error) {
        toast.error("No se pudo analizar", {
          description:
            error instanceof Error ? error.message : "Intenta con otra foto",
        });
      } finally {
        setLoading(false);
      }
    },
    [brand],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  function goToResults() {
    if (!result) return;
    const piece = activePiece || result.pieza;

    if (!brand) {
      toast.message("Agrega la marca del auto", {
        description:
          "Así filtramos solo repuestos compatibles y reduces resultados irrelevantes.",
      });
      return;
    }

    const params = new URLSearchParams();
    params.set("brand", brand);
    if (model.trim()) params.set("model", model.trim());
    if (year.trim()) params.set("year", year.trim());

    const terms = [
      piece,
      ...(result.keywords ?? []).filter((k) => !excludedKeywords.includes(k)),
    ].filter(Boolean);

    if (terms.length) {
      params.set("q", terms.slice(0, 4).join(" "));
      params.set("keywords", terms.join(","));
    }

    router.push(`/?${params.toString()}#catalogo`);
  }

  function clear() {
    setPreview(null);
    setResult(null);
    setActivePiece(null);
    setExcludedKeywords([]);
  }

  function toggleKeyword(kw: string) {
    setExcludedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw],
    );
  }

  const confidence = result?.confianza;
  const alternatives = result?.alternativas ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="flex items-start gap-2">
          <Car className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="font-heading text-lg tracking-wide">
              ¿Para qué vehículo?
            </p>
            <p className="text-sm text-muted-foreground">
              La foto dice qué pieza es; marca, modelo y año dicen si te sirve.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-1">
            <Label>
              Marca <span className="text-primary">*</span>
            </Label>
            <Select value={brand} onValueChange={(v) => setBrand(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ej. Chevrolet" />
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
              placeholder="Ej. Aveo"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vehicle-year">Año</Label>
            <Input
              id="vehicle-year"
              type="number"
              inputMode="numeric"
              min={1990}
              max={2030}
              placeholder="Ej. 2016"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </div>
      </div>

      <PhotoGuide />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          dragging
            ? "border-primary bg-primary/10"
            : "border-border/80 bg-card/50"
        }`}
      >
        {preview ? (
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={preview}
              alt="Pieza a identificar"
              fill
              className="object-cover"
              unoptimized
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-3 top-3"
              onClick={clear}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <label className="flex min-h-80 cursor-pointer flex-col items-center justify-center gap-3 px-6 py-12 text-center sm:min-h-[22rem]">
            <motion.div
              animate={{ y: [0, -6, 0], scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30"
            >
              <Upload className="size-7" />
            </motion.div>
            <div>
              <p className="font-heading text-xl tracking-wide">
                Sube la foto de la pieza
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {brand
                  ? "Arrastra aquí o selecciona desde tu galería"
                  : "Primero elige la marca del auto arriba"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG o WEBP · máximo 8 MB
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="secondary" className="gap-2" asChild>
                <span>
                  <Camera className="size-4" />
                  Tomar / elegir foto
                </span>
              </Button>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void processFile(file);
              }}
            />
          </label>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative space-y-3 overflow-hidden rounded-xl border border-primary/30 bg-card/60 p-4"
          >
            <motion.div
              className="pointer-events-none absolute inset-x-0 h-0.5 bg-primary/80"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Escaneando la pieza con Gemini...
            </div>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-xl border border-primary/40 bg-gradient-to-b from-primary/10 to-card/80 p-5"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="mt-1 size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                  Creemos que es
                </p>
                <h3 className="font-heading text-3xl tracking-wide">
                  {activePiece || result.pieza}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span>
                    Categoría:{" "}
                    <span className="text-accent">{result.categoria}</span>
                  </span>
                  {typeof confidence === "number" && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        confidence >= 75
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : confidence >= 50
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-red-500/15 text-red-700 dark:text-red-300"
                      }`}
                    >
                      Confianza {confidence}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {alternatives.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  ¿No es esto? Elige otra opción
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePiece(result.pieza)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                      (activePiece || result.pieza) === result.pieza
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/70 hover:border-primary/30"
                    }`}
                  >
                    {result.pieza}
                  </button>
                  {alternatives.map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => setActivePiece(alt)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                        activePiece === alt
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/70 hover:border-primary/30"
                      }`}
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Palabras clave (toca para excluir)
              </p>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw) => {
                  const off = excludedKeywords.includes(kw);
                  return (
                    <Badge
                      key={kw}
                      variant={off ? "outline" : "secondary"}
                      className={`cursor-pointer ${off ? "opacity-40 line-through" : ""}`}
                      onClick={() => toggleKeyword(kw)}
                    >
                      {kw}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={goToResults}>
              {brand
                ? `Buscar “${activePiece || result.pieza}” para ${brand}${model ? ` ${model}` : ""}`
                : "Ver repuestos disponibles en Ambato"}
            </Button>
            {!brand && (
              <p className="text-center text-xs text-muted-foreground">
                Selecciona la marca arriba para acotar resultados.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
