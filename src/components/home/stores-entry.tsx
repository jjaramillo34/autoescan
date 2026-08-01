import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECTORES_AMBATO } from "@/lib/constants";
import { contactPhone } from "@/lib/phone";
import { getPublicStores } from "@/lib/stores";
import { buildStoreWhatsAppUrl } from "@/lib/whatsapp";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export async function StoresEntry() {
  const stores = (await getPublicStores()).slice(0, 2);
  const preview = SECTORES_AMBATO.slice(0, 4);

  return (
    <section className="space-y-5" aria-labelledby="tiendas-entry-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Store className="size-3.5 text-accent" />
            Locales reales
          </p>
          <h2
            id="tiendas-entry-title"
            className="font-heading text-2xl tracking-wide sm:text-3xl"
          >
            Tiendas en Ambato
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Sectores como {preview.join(", ")}
            {SECTORES_AMBATO.length > preview.length ? "…" : ""}.
          </p>
        </div>
        <Link
          href="/tiendas"
          className="inline-flex items-center gap-2 self-start font-heading text-base tracking-wide text-primary transition-colors hover:text-primary/80"
        >
          Ver todas
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {stores.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {stores.map((store) => {
            const name = store.storeName || store.name;
            const wa = buildStoreWhatsAppUrl({
              phone: contactPhone(store),
              storeName: name,
            });
            return (
              <article
                key={store._id}
                className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-primary/30"
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
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-heading text-lg tracking-wide">
                      {name}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 text-accent" />
                      {store.storeSector || "Ambato"}
                      {" · "}
                      {store.productCount} repuestos
                    </p>
                    {store.storeDescription && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {store.storeDescription}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tienda/${store._id}`}>Ver perfil</Link>
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
      ) : null}
    </section>
  );
}
