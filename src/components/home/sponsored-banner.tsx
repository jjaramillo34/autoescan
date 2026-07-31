"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildStoreWhatsAppUrl } from "@/lib/whatsapp";

export interface SponsoredBannerData {
  text: string;
  storeName: string;
  sellerId: string;
  phone: string;
  location: string;
  logoUrl?: string;
  tagline: string;
  until?: string;
}

function storeInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function SponsoredBanner({ banner }: { banner: SponsoredBannerData }) {
  const waUrl = buildStoreWhatsAppUrl({
    phone: banner.phone,
    storeName: banner.storeName,
    message: `Hola ${banner.storeName}, vi su anuncio destacado en AutoEscán (“${banner.text}”) y quiero consultar por repuestos.`,
  });

  const inventoryHref = `/tienda/${banner.sellerId}`;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/20 via-card to-card"
    >
      <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        {/* Logo / marca de la tienda */}
        <div className="flex items-center gap-3 sm:min-w-[200px]">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-xl tracking-wide text-primary-foreground shadow-sm sm:size-16 sm:text-2xl">
            {banner.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner.logoUrl}
                alt={banner.storeName}
                className="size-full rounded-xl object-cover"
              />
            ) : (
              storeInitials(banner.storeName)
            )}
          </div>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
              <Sparkles className="size-3" />
              Destacado
            </p>
            <h3 className="truncate font-heading text-xl tracking-wide sm:text-2xl">
              {banner.storeName}
            </h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {banner.location}
            </p>
          </div>
        </div>

        {/* Mensaje promocional */}
        <div className="min-w-0 flex-1 space-y-1 border-t border-border/50 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="font-medium leading-snug text-foreground">
            {banner.text}
          </p>
          <p className="text-xs text-muted-foreground">{banner.tagline}</p>
        </div>

        {/* CTAs */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[180px]">
          <Button asChild className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1ebe57]">
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              WhatsApp ahora
            </a>
          </Button>
          <Button asChild variant="secondary" className="w-full gap-2">
            <Link href={inventoryHref}>
              <Package className="size-4" />
              Ver sus productos
            </Link>
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
