import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  Store,
} from "lucide-react";
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
import { auth } from "@/auth";
import { isWhatsAppLoginRequired } from "@/lib/whatsapp-gate";
import { buildPartJsonLd, buildPartMetadata } from "@/lib/seo/part-seo";

interface PartDetailProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PartDetailProps): Promise<Metadata> {
  const { id } = await params;
  const part = await getPartById(id);
  if (!part) {
    return {
      title: "Repuesto no encontrado",
      robots: { index: false, follow: false },
    };
  }
  return buildPartMetadata(part);
}

export default async function PartDetailPage({ params }: PartDetailProps) {
  const { id } = await params;
  const [part, session] = await Promise.all([getPartById(id), auth()]);
  if (!part) notFound();
  const showAccountHint = !session?.user && !isWhatsAppLoginRequired();

  const related = await getRelatedParts(part, 4);
  const seller = typeof part.seller === "string" ? null : part.seller;
  const storeName = seller?.storeName || seller?.name || "Vendedor";
  const sellerId = seller?._id;
  const jsonLd = buildPartJsonLd(part);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 pb-28 sm:py-10 md:pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TrackPartView
        partId={part._id}
        sellerId={sellerId ? String(sellerId) : undefined}
        title={part.title}
        brand={part.brand}
        model={part.model}
        year={part.yearRange}
        location={part.location}
      />

      <nav
        aria-label="Miga de pan"
        className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-primary">
          Inicio
        </Link>
        <ChevronRight className="size-3 opacity-50" />
        <Link href="/#catalogo" className="hover:text-primary">
          Catálogo
        </Link>
        <ChevronRight className="size-3 opacity-50" />
        <Link
          href={`/?category=${encodeURIComponent(part.category)}#catalogo`}
          className="hover:text-primary"
        >
          {part.category}
        </Link>
        <ChevronRight className="size-3 opacity-50" />
        <span className="line-clamp-1 text-foreground">{part.title}</span>
      </nav>

      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
          <Link href="/#catalogo">
            <ArrowLeft className="size-4" />
            Volver al catálogo
          </Link>
        </Button>
      </div>

      <article className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
        <PartGallery images={part.images} alt={part.title} />

        <div className="space-y-5">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                {part.category}
              </span>
              <StockBadge quantity={part.stockQuantity} />
              {part.isFeatured && (
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  Destacado
                </span>
              )}
            </div>
            <h1 className="font-heading text-3xl tracking-wide sm:text-4xl">
              {part.title}
            </h1>
            <p className="text-base text-muted-foreground">
              Compatible con{" "}
              <span className="font-medium text-foreground">
                {part.brand} {part.model}
              </span>{" "}
              · {part.yearRange}
            </p>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/50 pb-4">
              <p className="font-heading text-4xl tracking-wide text-primary">
                ${part.price.toFixed(2)}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  USD
                </span>
              </p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 text-accent" />
                {part.location}
                {seller?.city ? ` · ${seller.city}` : " · Ambato"}
              </p>
            </div>
          </header>

          <section className="space-y-3" aria-labelledby="desc-title">
            <h2
              id="desc-title"
              className="font-heading text-lg tracking-wide"
            >
              Descripción
            </h2>
            {part.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {part.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {part.title} para {part.brand} {part.model} ({part.yearRange})
                {part.partCode ? ` · código ${part.partCode}` : ""}.
              </p>
            )}

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">Marca del auto</dt>
                <dd className="text-sm font-semibold">{part.brand}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">Modelo</dt>
                <dd className="text-sm font-semibold">{part.model}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">Años</dt>
                <dd className="text-sm font-semibold">{part.yearRange}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">Stock</dt>
                <dd className="text-sm font-semibold">
                  {part.stockQuantity} und.
                </dd>
              </div>
              {part.partCode && (
                <div className="space-y-0.5">
                  <dt className="text-xs text-muted-foreground">Código</dt>
                  <dd className="font-mono text-sm font-semibold tracking-wide">
                    {part.partCode}
                  </dd>
                </div>
              )}
              {part.partBrand && (
                <div className="space-y-0.5">
                  <dt className="text-xs text-muted-foreground">
                    Marca del repuesto
                  </dt>
                  <dd className="text-sm font-semibold">{part.partBrand}</dd>
                </div>
              )}
              {seller?.businessHours && (
                <div className="col-span-2 space-y-0.5 border-t border-border/50 pt-3">
                  <dt className="text-xs text-muted-foreground">
                    Horario del local
                  </dt>
                  <dd className="flex items-center gap-1.5 text-sm font-semibold">
                    <Clock className="size-3.5 text-accent" />
                    {seller.businessHours}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <div className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
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
            {showAccountHint && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Opcional:{" "}
                <Link
                  href={`/registro?callbackUrl=${encodeURIComponent(`/repuesto/${part._id}`)}`}
                  className="font-medium text-primary hover:underline"
                >
                  crea una cuenta
                </Link>{" "}
                para guardar favoritos. WhatsApp no requiere login.
              </p>
            )}
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
      </article>

      {/* CTA sticky móvil */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border/60 bg-background/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{part.title}</p>
            <p className="font-heading text-lg text-primary">
              ${part.price.toFixed(2)}
            </p>
          </div>
          <div className="w-[52%]">
            <BotonWhatsApp part={part} size="default" label="WhatsApp" />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="space-y-4" aria-labelledby="related-title">
          <h2
            id="related-title"
            className="font-heading text-2xl tracking-wide"
          >
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
