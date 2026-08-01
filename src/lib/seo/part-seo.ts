import type { Metadata } from "next";
import type { PartDTO } from "@/lib/types";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

const FALLBACK_OG = absoluteUrl("/icons/icon-512.png");

export function partSeoDescription(part: PartDTO): string {
  const base =
    part.description?.trim() ||
    `${part.title} para ${part.brand} ${part.model} (${part.yearRange}).`;
  const code = part.partCode ? ` Código ${part.partCode}.` : "";
  const place = ` Disponible en ${part.location}, Ambato · AutoEscán.`;
  const text = `${base}${code}${place}`.replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export function partSeoTitle(part: PartDTO): string {
  const brandBit = [part.partBrand, part.partCode].filter(Boolean).join(" ");
  const vehicle = `${part.brand} ${part.model}`;
  if (brandBit) {
    return `${part.title} ${brandBit} · ${vehicle}`;
  }
  return `${part.title} · ${vehicle} (${part.yearRange})`;
}

export function buildPartMetadata(part: PartDTO): Metadata {
  const title = partSeoTitle(part);
  const description = partSeoDescription(part);
  const url = absoluteUrl(`/repuesto/${part._id}`);
  const images = (part.images?.length ? part.images : [FALLBACK_OG]).slice(0, 4);
  const ogImages = images.map((src) => ({
    url: src.startsWith("http") ? src : absoluteUrl(src),
    width: 1200,
    height: 630,
    alt: `${part.title} — ${part.brand} ${part.model}`,
  }));

  return {
    title,
    description,
    keywords: [
      part.title,
      part.brand,
      part.model,
      part.category,
      part.partBrand,
      part.partCode,
      "repuestos",
      "Ambato",
      "Ecuador",
      "AutoEscán",
    ].filter(Boolean) as string[],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "es_EC",
      url,
      siteName: "AutoEscán",
      title,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
    other: {
      "product:price:amount": part.price.toFixed(2),
      "product:price:currency": "USD",
      "product:availability":
        part.stockQuantity > 0 ? "in stock" : "out of stock",
    },
  };
}

/** JSON-LD Product + BreadcrumbList for Google. */
export function buildPartJsonLd(part: PartDTO) {
  const seller = typeof part.seller === "string" ? null : part.seller;
  const url = absoluteUrl(`/repuesto/${part._id}`);
  const images = (part.images?.length ? part.images : [FALLBACK_OG]).map(
    (src) => (src.startsWith("http") ? src : absoluteUrl(src)),
  );

  const product = {
    "@type": "Product",
    name: part.title,
    description: partSeoDescription(part),
    image: images,
    sku: part.partCode || part._id,
    brand: part.partBrand
      ? { "@type": "Brand", name: part.partBrand }
      : undefined,
    category: part.category,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: part.price.toFixed(2),
      availability:
        part.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: seller
        ? {
            "@type": "AutoPartsStore",
            name: seller.storeName || seller.name,
            address: {
              "@type": "PostalAddress",
              addressLocality: seller.city || "Ambato",
              addressRegion: seller.province || "Tungurahua",
              addressCountry: "EC",
            },
          }
        : {
            "@type": "Organization",
            name: "AutoEscán",
          },
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Vehículo", value: part.brand },
      { "@type": "PropertyValue", name: "Modelo", value: part.model },
      { "@type": "PropertyValue", name: "Años", value: part.yearRange },
      {
        "@type": "PropertyValue",
        name: "Sector",
        value: part.location,
      },
    ],
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: getSiteUrl(),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catálogo",
        item: absoluteUrl("/#catalogo"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: part.title,
        item: url,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [product, breadcrumb],
  };
}
