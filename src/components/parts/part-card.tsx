"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Images, MapPin, MessageCircle, Star, Store } from "lucide-react";
import { motion } from "framer-motion";
import { StockBadge } from "@/components/parts/stock-badge";
import { SavePartButton } from "@/components/parts/save-part-button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { PartDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PartCardProps {
  part: PartDTO;
  index?: number;
}

const FALLBACK =
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80";

export function PartCard({ part, index = 0 }: PartCardProps) {
  const gallery =
    part.images.length > 0 ? part.images.slice(0, 5) : [FALLBACK];
  const [active, setActive] = useState(0);
  const image = gallery[Math.min(active, gallery.length - 1)] ?? FALLBACK;
  const seller = typeof part.seller === "string" ? null : part.seller;
  const storeName = seller?.storeName || seller?.name;
  const outOfStock = part.stockQuantity <= 0;
  const detailHref = `/repuesto/${part._id}`;
  const waHref = buildWhatsAppUrl(part);
  const sellerId = seller?._id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.28) }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
        "shadow-[0_1px_0_oklch(0.2_0.02_250/0.04)]",
        "transition-[border-color,box-shadow,transform] duration-300",
        "hover:-translate-y-0.5 hover:border-primary/35",
        "hover:shadow-[0_12px_28px_-16px_oklch(0.35_0.08_45/0.45)]",
      )}
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Link
          href={detailHref}
          className="absolute inset-0"
          aria-label={`Ver ${part.title}`}
        >
          <Image
            src={image}
            alt={part.title}
            fill
            className={cn(
              "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]",
              outOfStock && "opacity-70 grayscale-[0.35]",
            )}
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/25" />

        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <StockBadge
            quantity={part.stockQuantity}
            className="backdrop-blur-md shadow-sm"
          />
          {part.isFeatured && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm">
              <Star className="size-3 fill-current" />
              Destacado
            </span>
          )}
        </div>

        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
          {gallery.length > 1 && (
            <div className="flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <Images className="size-3" />
              {gallery.length}
            </div>
          )}
          <SavePartButton
            partId={part._id}
            partTitle={part.title}
            sellerId={sellerId}
            brand={part.brand}
            model={part.model}
            location={part.location}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm">
            {part.category}
          </span>
          {gallery.length > 1 && (
            <div className="flex items-center gap-1">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Foto ${i + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActive(i);
                  }}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === active
                      ? "w-3.5 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/80",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-3 p-3.5 sm:p-4">
        <div className="space-y-1.5">
          <Link href={detailHref} className="block">
            <h3 className="font-heading text-[1.15rem] leading-snug tracking-wide transition-colors group-hover:text-primary sm:text-xl">
              {part.title}
            </h3>
          </Link>
          <p className="text-[13px] leading-snug text-muted-foreground">
            <span className="font-medium text-foreground/80">{part.brand}</span>{" "}
            {part.model}
            <span className="mx-1.5 text-border">·</span>
            {part.yearRange}
          </p>
          {(part.partCode || part.partBrand) && (
            <p className="text-[11px] text-muted-foreground">
              {part.partCode && (
                <span className="font-mono tracking-wide text-foreground/80">
                  {part.partCode}
                </span>
              )}
              {part.partBrand && (
                <span>
                  {part.partCode ? " · " : ""}
                  {part.partBrand}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-end justify-between gap-3 border-t border-border/50 pt-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Precio
              </p>
              <p className="font-heading text-[1.75rem] leading-none tracking-wide text-primary">
                ${part.price.toFixed(2)}
                <span className="ml-1 text-xs font-normal tracking-normal text-muted-foreground">
                  USD
                </span>
              </p>
            </div>
            <p className="mb-0.5 flex max-w-[45%] items-center justify-end gap-1 text-right text-[11px] leading-tight text-muted-foreground">
              <MapPin className="size-3 shrink-0 text-accent" />
              <span className="truncate">{part.location}</span>
            </p>
          </div>

          {storeName && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Store className="size-3 shrink-0" />
              {sellerId ? (
                <Link
                  href={`/tienda/${sellerId}`}
                  className="truncate transition-colors hover:text-primary"
                >
                  {storeName}
                </Link>
              ) : (
                <span className="truncate">{storeName}</span>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Link
              href={detailHref}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border/80 bg-background text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted/60"
            >
              Ver detalle
            </Link>
            {outOfStock ? (
              <span className="inline-flex h-9 flex-[1.15] items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
                Sin stock
              </span>
            ) : (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void fetch("/api/analytics/whatsapp-click", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      partId: part._id,
                      sellerId,
                      query: part.title,
                    }),
                  });
                }}
                className="inline-flex h-9 flex-[1.15] items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-sm font-medium text-white transition-colors hover:bg-[#1ebe57]"
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
