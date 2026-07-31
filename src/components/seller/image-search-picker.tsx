"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Loader2, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_PART_IMAGES } from "@/lib/constants";
import { uploadImageFromUrl } from "@/lib/upload-client";

interface SearchImage {
  url: string;
  title?: string;
}

interface ImageSearchPickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  suggestedQuery?: string;
  maxImages?: number;
}

export function ImageSearchPicker({
  value,
  onChange,
  suggestedQuery = "",
  maxImages = MAX_PART_IMAGES,
}: ImageSearchPickerProps) {
  const [query, setQuery] = useState(suggestedQuery);
  const [results, setResults] = useState<SearchImage[]>([]);
  const [pending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);
  const [touched, setTouched] = useState(false);
  const [hostedBySource, setHostedBySource] = useState<Record<string, string>>(
    {},
  );
  const [uploadingUrl, setUploadingUrl] = useState<string | null>(null);

  const remaining = maxImages - value.length;

  useEffect(() => {
    if (!touched && suggestedQuery) {
      setQuery(suggestedQuery);
    }
  }, [suggestedQuery, touched]);

  function hostedFor(sourceUrl: string) {
    return hostedBySource[sourceUrl];
  }

  function isSelected(sourceUrl: string) {
    const hosted = hostedFor(sourceUrl);
    return Boolean(
      (hosted && value.includes(hosted)) || value.includes(sourceUrl),
    );
  }

  async function toggleUrl(url: string) {
    const hosted = hostedFor(url);
    if (hosted && value.includes(hosted)) {
      onChange(value.filter((u) => u !== hosted));
      return;
    }
    if (value.includes(url)) {
      onChange(value.filter((u) => u !== url));
      return;
    }
    if (value.length >= maxImages) {
      toast.message(`Máximo ${maxImages} fotos`, {
        description: "Quita una para elegir otra.",
      });
      return;
    }

    setUploadingUrl(url);
    try {
      const ikUrl = await uploadImageFromUrl(url);
      setHostedBySource((prev) => ({ ...prev, [url]: ikUrl }));
      onChange([...value, ikUrl].slice(0, maxImages));
      toast.success("Foto guardada en ImageKit");
    } catch (error) {
      toast.error("No se pudo hospedar la foto", {
        description:
          error instanceof Error
            ? error.message
            : "Revisa las claves de ImageKit",
      });
    } finally {
      setUploadingUrl(null);
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function search(e?: React.FormEvent) {
    e?.preventDefault();
    const q = (query || suggestedQuery).trim();
    if (!q) {
      toast.error("Escribe el nombre de la pieza para buscar fotos");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/search-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            max_results: 15,
            region: "ec-es",
            safesearch: "moderate",
          }),
        });
        const data = (await res.json()) as {
          images?: SearchImage[];
          error?: string;
        };

        if (!res.ok) {
          toast.error("No se pudo buscar", {
            description: data.error || "Revisa FAST_API_KEY en .env.local",
          });
          return;
        }

        setResults(data.images ?? []);
        setSearched(true);
        if (!(data.images?.length)) {
          toast.message("Sin resultados", {
            description: "Prueba con otra descripción (marca + pieza).",
          });
        }
      } catch {
        toast.error("Error de red al buscar imágenes");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="image-search-query">Buscar fotos en internet</Label>
          <span className="text-[11px] text-muted-foreground">
            {value.length}/{maxImages} · se suben a ImageKit
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            id="image-search-query"
            value={query}
            onChange={(e) => {
              setTouched(true);
              setQuery(e.target.value);
            }}
            placeholder={
              suggestedQuery || "Ej. sensor MAF Hyundai Tucson 2018"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 gap-1.5"
            onClick={() => search()}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Al elegir una foto se copia a tu carpeta{" "}
          <code className="text-[10px]">/autoescan</code> en ImageKit.
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-border/60"
            >
              <Image
                src={url}
                alt={`Foto ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1 py-0.5 text-[9px] font-medium text-primary-foreground">
                  Portada
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 text-foreground shadow-sm"
                aria-label={`Quitar foto ${index + 1}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {searched && results.length > 0 && (
        <div className="space-y-2">
          <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {remaining > 0
              ? `Toca hasta ${remaining} foto${remaining === 1 ? "" : "s"} más`
              : "Máximo alcanzado — quita una para cambiar"}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {results.map((img) => {
              const selected = isSelected(img.url);
              const uploading = uploadingUrl === img.url;
              const hosted = hostedFor(img.url);
              const order = hosted
                ? value.indexOf(hosted) + 1
                : value.indexOf(img.url) + 1;
              return (
                <button
                  key={img.url}
                  type="button"
                  disabled={uploading || (!selected && remaining === 0)}
                  onClick={() => void toggleUrl(img.url)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                    selected
                      ? "border-primary ring-2 ring-primary/30"
                      : remaining === 0
                        ? "border-transparent opacity-50"
                        : "border-transparent hover:border-primary/40"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.title || "Resultado"}
                    className="size-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {uploading && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="size-5 animate-spin text-white" />
                    </span>
                  )}
                  {selected && !uploading && (
                    <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {order > 0 ? order : <Check className="size-3" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
