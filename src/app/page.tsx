import { Suspense } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { PartFilters } from "@/components/parts/part-filters";
import { PartCard } from "@/components/parts/part-card";
import { PartsSkeleton } from "@/components/parts/parts-skeleton";
import { EmptyParts } from "@/components/parts/empty-parts";
import { CatalogPagination } from "@/components/parts/catalog-pagination";
import { HomeHero } from "@/components/home/home-hero";
import { CategoryShortcuts } from "@/components/home/category-shortcuts";
import { SectorChips } from "@/components/home/sector-chips";
import { VehicleBar } from "@/components/home/vehicle-bar";
import { RecentPartsRail } from "@/components/home/recent-parts-rail";
import { LocalTrust } from "@/components/home/local-trust";
import { SponsoredBanner } from "@/components/home/sponsored-banner";
import { getParts, getPublicSeller } from "@/lib/parts-service";
import { getHomeBanner } from "@/lib/home-banner";
import { isDatabaseConfigured } from "@/lib/db";
import type { PartSort } from "@/lib/types";

interface HomeProps {
  searchParams: Promise<{
    brand?: string;
    model?: string;
    year?: string;
    category?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    q?: string;
    keywords?: string;
    seller?: string;
    page?: string;
    sort?: string;
  }>;
}

function parseSort(value?: string): PartSort {
  if (
    value === "precio_asc" ||
    value === "precio_desc" ||
    value === "recientes" ||
    value === "relevancia"
  ) {
    return value;
  }
  return "relevancia";
}

async function PartsResults({
  searchParams,
}: {
  searchParams: Awaited<HomeProps["searchParams"]>;
}) {
  const keywords = searchParams.keywords
    ? searchParams.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  const minPrice = Number(searchParams.minPrice);
  const maxPrice = Number(searchParams.maxPrice);

  const catalog = await getParts({
    brand: searchParams.brand,
    model: searchParams.model,
    year: searchParams.year,
    category: searchParams.category,
    location: searchParams.location,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    q: searchParams.q,
    keywords,
    seller: searchParams.seller,
    page: Math.max(1, Number(searchParams.page) || 1),
    sort: parseSort(searchParams.sort),
  });

  if (catalog.total === 0) {
    return <EmptyParts />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {catalog.total} repuesto{catalog.total === 1 ? "" : "s"} encontrado
        {catalog.total === 1 ? "" : "s"}
        {catalog.totalPages > 1
          ? ` · mostrando ${catalog.items.length} en esta página`
          : ""}
        {searchParams.location ? ` · ${searchParams.location}` : ""}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.items.map((part, index) => (
          <PartCard key={part._id} part={part} index={index} />
        ))}
      </div>
      <Suspense fallback={null}>
        <CatalogPagination
          page={catalog.page}
          totalPages={catalog.totalPages}
          total={catalog.total}
        />
      </Suspense>
    </div>
  );
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const usingDemo = !isDatabaseConfigured();
  const banner = await getHomeBanner();

  let filteringSeller: string | null = null;
  if (params.seller) {
    if (banner?.sellerId === params.seller) {
      filteringSeller = banner.storeName;
    } else {
      const seller = await getPublicSeller(params.seller);
      filteringSeller = seller?.storeName || seller?.name || "esta tienda";
    }
  }

  return (
    <div className="space-y-0 pb-20 md:pb-0">
      <HomeHero />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
        <Suspense fallback={null}>
          <VehicleBar />
        </Suspense>

        <Suspense fallback={null}>
          <CategoryShortcuts />
        </Suspense>

        {banner && <SponsoredBanner banner={banner} />}

        <Suspense fallback={null}>
          <RecentPartsRail />
        </Suspense>

        {usingDemo && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            Modo demostración activo (sin MongoDB). Configura{" "}
            <code className="text-xs">MONGODB_URI</code> en{" "}
            <code className="text-xs">.env.local</code> para datos persistentes.
          </p>
        )}

        <div id="catalogo" className="scroll-mt-28 space-y-4">
          <Suspense fallback={null}>
            <SectorChips />
          </Suspense>

          <Suspense fallback={null}>
            <PartFilters />
          </Suspense>

          <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
            <div className="space-y-1">
              <h2 className="font-heading text-2xl tracking-wide sm:text-3xl">
                {filteringSeller
                  ? `Productos de ${filteringSeller}`
                  : "Disponibles cerca de ti"}
              </h2>
              {filteringSeller && params.seller && (
                <div className="flex flex-wrap gap-3 text-xs">
                  <Link
                    href={`/tienda/${params.seller}`}
                    className="text-primary hover:underline"
                  >
                    Ver página de la tienda
                  </Link>
                  <Link
                    href="/#catalogo"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                  >
                    <X className="size-3.5" />
                    Ver todo el catálogo
                  </Link>
                </div>
              )}
            </div>
          </div>

          <Suspense fallback={<PartsSkeleton />}>
            <PartsResults searchParams={params} />
          </Suspense>
        </div>
      </div>

      <LocalTrust />
    </div>
  );
}
