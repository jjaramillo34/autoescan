import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, ShieldCheck, Store } from "lucide-react";
import { TrackPartView } from "@/components/analytics/track-part-view";
import { PartGallery } from "@/components/parts/part-gallery";
import { PartCard } from "@/components/parts/part-card";
import { StockBadge } from "@/components/parts/stock-badge";
import { BotonWhatsApp } from "@/components/parts/boton-whatsapp";
import { SharePart } from "@/components/parts/share-part";
import { SavePartButton } from "@/components/parts/save-part-button";
import { ReportPartButton } from "@/components/parts/report-part-button";
import { Button } from "@/components/ui/button";
import {
  getPartById,
  getRelatedParts,
} from "@/lib/parts-service";

interface PartDetailProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PartDetailProps): Promise<Metadata> {
  const { id } = await params;
  const part = await getPartById(id);
  if (!part) return { title: "Repuesto no encontrado" };
  return {
    title: `${part.title} · ${part.brand} ${part.model}`,
    description:
      part.description ||
      `${part.title} para ${part.brand} ${part.model} (${part.yearRange}) en Ambato.`,
  };
}

export default async function PartDetailPage({ params }: PartDetailProps) {
  const { id } = await params;
  const part = await getPartById(id);
  if (!part) notFound();

  const related = await getRelatedParts(part, 4);
  const seller = typeof part.seller === "string" ? null : part.seller;
  const storeName = seller?.storeName || seller?.name || "Vendedor";
  const sellerId = seller?._id;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 pb-24 sm:py-10 md:pb-10">
      <TrackPartView
        partId={part._id}
        sellerId={sellerId ? String(sellerId) : undefined}
        title={part.title}
        brand={part.brand}
        model={part.model}
        year={part.yearRange}
        location={part.location}
      />
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
          <Link href="/#catalogo">
            <ArrowLeft className="size-4" />
            Volver al catálogo
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <PartGallery images={part.images} alt={part.title} />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                {part.category}
              </span>
              <StockBadge quantity={part.stockQuantity} />
            </div>
            <h1 className="font-heading text-3xl tracking-wide sm:text-4xl">
              {part.title}
            </h1>
            <p className="text-muted-foreground">
              Compatible con {part.brand} {part.model} · {part.yearRange}
            </p>
            {(part.partCode || part.partBrand) && (
              <p className="text-sm">
                {part.partCode && (
                  <span className="mr-2 font-mono text-xs tracking-wide text-foreground">
                    Código {part.partCode}
                  </span>
                )}
                {part.partBrand && (
                  <span className="text-muted-foreground">
                    · {part.partBrand}
                  </span>
                )}
              </p>
            )}
            <p className="font-heading text-4xl tracking-wide text-primary">
              ${part.price.toFixed(2)}{" "}
              <span className="text-base font-normal text-muted-foreground">
                USD
              </span>
            </p>
          </div>

          {part.description && (
            <div className="space-y-1.5">
              <h2 className="text-sm font-medium">Descripción</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {part.description}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-card/50 p-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Marca del auto</dt>
              <dd className="font-medium">{part.brand}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Modelo</dt>
              <dd className="font-medium">{part.model}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Años</dt>
              <dd className="font-medium">{part.yearRange}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stock</dt>
              <dd className="font-medium">{part.stockQuantity} und.</dd>
            </div>
            {part.partCode && (
              <div>
                <dt className="text-muted-foreground">Código</dt>
                <dd className="font-mono font-medium tracking-wide">
                  {part.partCode}
                </dd>
              </div>
            )}
            {part.partBrand && (
              <div>
                <dt className="text-muted-foreground">Marca del repuesto</dt>
                <dd className="font-medium">{part.partBrand}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-muted-foreground">Ubicación</dt>
              <dd className="flex items-center gap-1 font-medium">
                <MapPin className="size-3.5 text-accent" />
                {part.location}
                {seller?.city ? `, ${seller.city}` : ""}
              </dd>
            </div>
          </dl>

          <div className="space-y-3 rounded-xl border border-border/60 bg-card/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                  <Store className="size-3.5" />
                  Vendedor
                </p>
                <p className="font-heading text-xl tracking-wide">{storeName}</p>
                {seller?.name && seller.name !== storeName && (
                  <p className="text-sm text-muted-foreground">{seller.name}</p>
                )}
              </div>
              {sellerId && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/tienda/${sellerId}`}>Ver tienda</Link>
                </Button>
              )}
            </div>
            <BotonWhatsApp part={part} size="lg" />
            <div className="flex gap-2">
              <SavePartButton
                partId={part._id}
                partTitle={part.title}
                sellerId={sellerId ? String(sellerId) : undefined}
                brand={part.brand}
                model={part.model}
                location={part.location}
                variant="button"
              />
            </div>
            <SharePart part={part} />
            <ReportPartButton partId={part._id} partTitle={part.title} />
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Local en Ambato · Contacto directo por WhatsApp · Sin
              intermediarios
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl tracking-wide">
            También te puede servir
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <PartCard key={item._id} part={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
