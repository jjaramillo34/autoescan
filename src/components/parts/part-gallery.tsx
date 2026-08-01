"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&q=80";

interface PartGalleryProps {
  images: string[];
  alt: string;
}

export function PartGallery({ images, alt }: PartGalleryProps) {
  const gallery = images.length > 0 ? images.slice(0, 5) : [FALLBACK];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const current = gallery[Math.min(active, gallery.length - 1)] ?? FALLBACK;

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % gallery.length);
  }, [gallery.length]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prev, next]);

  return (
    <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-border/50",
          "bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.97_0.01_80),oklch(0.94_0.01_250))]",
          "dark:bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.28_0.02_250),oklch(0.22_0.02_250))]",
        )}
      >
        <button
          type="button"
          className="relative block aspect-[4/3] w-full sm:aspect-square"
          onClick={() => setLightbox(true)}
          aria-label="Ampliar foto"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0.35, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <Image
                src={current}
                alt={alt}
                fill
                className="object-contain p-3 sm:p-5"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
                priority
              />
            </motion.div>
          </AnimatePresence>
        </button>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/25 via-transparent to-transparent opacity-60" />

        {gallery.length > 1 && (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute left-3 top-1/2 size-10 -translate-y-1/2 rounded-full border border-border/40 bg-background/90 shadow-sm backdrop-blur-sm"
              onClick={prev}
              aria-label="Foto anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-3 top-1/2 size-10 -translate-y-1/2 rounded-full border border-border/40 bg-background/90 shadow-sm backdrop-blur-sm"
              onClick={next}
              aria-label="Foto siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-background/90 px-2 py-1 text-[11px] font-medium backdrop-blur-sm">
            <Images className="size-3 text-primary" />
            {gallery.length} foto{gallery.length === 1 ? "" : "s"}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 rounded-lg border border-border/40 bg-background/90 text-xs backdrop-blur-sm"
            onClick={() => setLightbox(true)}
          >
            <Expand className="size-3.5" />
            Ampliar
          </Button>
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gallery.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl border-2 bg-muted/40 transition-all",
                i === active
                  ? "border-primary shadow-[0_0_0_1px_oklch(0.55_0.12_45/0.35)]"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={url}
                alt={`${alt} ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Galería ampliada"
            onClick={() => setLightbox(false)}
          >
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-4 top-4 z-10 rounded-full"
              onClick={() => setLightbox(false)}
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </Button>

            {gallery.length > 1 && (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute left-4 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute right-4 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  aria-label="Foto siguiente"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </>
            )}

            <div
              className="relative h-[min(80vh,720px)] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={current}
                alt={alt}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
                priority
              />
            </div>

            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {active + 1} / {gallery.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
