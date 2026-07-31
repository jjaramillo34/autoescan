"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FALLBACK =
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80";

interface PartGalleryProps {
  images: string[];
  alt: string;
}

export function PartGallery({ images, alt }: PartGalleryProps) {
  const gallery = images.length > 0 ? images.slice(0, 5) : [FALLBACK];
  const [active, setActive] = useState(0);
  const current = gallery[Math.min(active, gallery.length - 1)] ?? FALLBACK;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted sm:aspect-[5/4]">
        <Image
          src={current}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
          priority
        />
        {gallery.length > 1 && (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 size-9 -translate-y-1/2 rounded-full"
              onClick={() =>
                setActive((i) => (i - 1 + gallery.length) % gallery.length)
              }
              aria-label="Foto anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 size-9 -translate-y-1/2 rounded-full"
              onClick={() => setActive((i) => (i + 1) % gallery.length)}
              aria-label="Foto siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="absolute bottom-3 right-3 rounded-md bg-background/85 px-2 py-0.5 text-xs backdrop-blur-sm">
              {active + 1}/{gallery.length}
            </span>
          </>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {gallery.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                i === active
                  ? "border-primary"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
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
    </div>
  );
}
