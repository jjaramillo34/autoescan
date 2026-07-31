import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, MessageCircle } from "lucide-react";
import { TrackStoreView } from "@/components/analytics/track-store-view";
import { PartCard } from "@/components/parts/part-card";
import { EmptyParts } from "@/components/parts/empty-parts";
import { Button } from "@/components/ui/button";
import { getParts, getPublicSeller } from "@/lib/parts-service";
import { contactPhone } from "@/lib/phone";
import { buildStoreWhatsAppUrl } from "@/lib/whatsapp";

interface StorePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const seller = await getPublicSeller(id);
  if (!seller) return { title: "Tienda no encontrada" };
  const name = seller.storeName || seller.name;
  return {
    title: name,
    description:
      seller.storeDescription ||
      `Repuestos de ${name} en ${seller.city || "Ambato"}, Tungurahua.`,
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function StorePage({
  params,
  searchParams,
}: StorePageProps) {
  const { id } = await params;
  const { page: pageRaw } = await searchParams;
  const seller = await getPublicSeller(id);
  if (!seller) notFound();

  const page = Math.max(1, Number(pageRaw) || 1);
  const catalog = await getParts({ seller: id, page, sort: "relevancia" });
  const storeName = seller.storeName || seller.name;
  const waUrl = buildStoreWhatsAppUrl({
    phone: contactPhone(seller),
    storeName,
  });
  const specs = seller.storeSpecializations ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 pb-24 sm:py-10 md:pb-10">
      <TrackStoreView
        sellerId={seller._id}
        storeName={storeName}
        location={seller.storeSector || seller.city}
      />
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/tiendas">
          <ArrowLeft className="size-4" />
          Ver todas las tiendas
        </Link>
      </Button>

      <header className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-primary sm:size-20">
            {seller.storeLogo ? (
              <Image
                src={seller.storeLogo}
                alt={storeName}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center font-heading text-xl text-primary-foreground sm:text-2xl">
                {initials(storeName)}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
              Tienda local
            </p>
            <h1 className="font-heading text-3xl tracking-wide sm:text-4xl">
              {storeName}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 text-accent" />
              {[seller.storeSector, seller.city, seller.province]
                .filter(Boolean)
                .join(" · ") || "Ambato, Tungurahua"}
            </p>
            {seller.businessHours && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4 text-accent" />
                {seller.businessHours}
              </p>
            )}
            {seller.storeDescription && (
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {seller.storeDescription}
              </p>
            )}
            {specs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {specs.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {catalog.total} repuesto{catalog.total === 1 ? "" : "s"} publicado
              {catalog.total === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Button
          asChild
          className="gap-2 bg-[#25D366] text-white hover:bg-[#1ebe57]"
        >
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" />
            WhatsApp a la tienda
          </a>
        </Button>
      </header>

      {catalog.items.length === 0 ? (
        <EmptyParts />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.items.map((part, index) => (
              <PartCard key={part._id} part={part} index={index} />
            ))}
          </div>
          {catalog.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {page > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/tienda/${id}?page=${page - 1}`}>Anterior</Link>
                </Button>
              )}
              <span className="flex items-center px-2 text-xs text-muted-foreground">
                {page} / {catalog.totalPages}
              </span>
              {page < catalog.totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/tienda/${id}?page=${page + 1}`}>Siguiente</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
