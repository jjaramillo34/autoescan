import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactPhone } from "@/lib/phone";
import { getPublicStores } from "@/lib/stores";
import { buildStoreWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tiendas en Ambato",
  description:
    "Locales de repuestos activos en AutoEscán — Ambato, Tungurahua.",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function TiendasPage() {
  const stores = await getPublicStores();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 pb-24 sm:py-10 md:pb-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
          Directorio local
        </p>
        <h1 className="font-heading text-3xl tracking-wide sm:text-4xl">
          Tiendas en Ambato
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Contacta al local por WhatsApp o revisa su inventario en AutoEscán.
        </p>
      </header>

      {stores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 px-6 py-16 text-center">
          <Store className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-heading text-xl">Aún no hay tiendas activas</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const name = store.storeName || store.name;
            const wa = buildStoreWhatsAppUrl({
              phone: contactPhone(store),
              storeName: name,
            });
            const specs = (store.storeSpecializations ?? []).slice(0, 3);
            return (
              <article
                key={store._id}
                className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/35"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary font-heading text-lg text-primary-foreground">
                    {store.storeLogo ? (
                      <Image
                        src={store.storeLogo}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    ) : (
                      initials(name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl tracking-wide">
                      {name}
                    </h2>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 text-accent" />
                      {[store.storeSector, store.city]
                        .filter(Boolean)
                        .join(" · ") || "Ambato, Tungurahua"}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Package className="size-3.5" />
                      {store.productCount} repuesto
                      {store.productCount === 1 ? "" : "s"}
                    </p>
                    {specs.length > 0 && (
                      <p className="mt-1.5 line-clamp-1 text-[11px] text-primary/90">
                        {specs.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tienda/${store._id}`}>Ver tienda</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe57]"
                  >
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="size-3.5" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
