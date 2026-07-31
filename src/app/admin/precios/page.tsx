import type { Metadata } from "next";
import Link from "next/link";
import { getPriceComparisons } from "@/lib/admin/price-compare";
import { StatCard } from "@/components/admin/stat-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comparador de precios" };

export default async function AdminPreciosPage() {
  const groups = await getPriceComparisons();
  const wide = groups.filter((g) => g.spreadPct >= 15).length;
  const avgSpread =
    groups.length > 0
      ? Math.round(
          groups.reduce((s, g) => s + g.spreadPct, 0) / groups.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl tracking-wide">
          Comparador de precios
        </h2>
        <p className="text-sm text-muted-foreground">
          Mismo código OEM/SKU en distintas tiendas. Útil para detectar outliers
          y oportunidades de impulso.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Códigos con ≥2 ofertas" value={groups.length} />
        <StatCard
          label="Spread promedio"
          value={`${avgSpread}%`}
          hint="(máx − mín) / mín"
        />
        <StatCard
          label="Spread ≥ 15%"
          value={wide}
          tone={wide > 0 ? "warning" : "default"}
        />
      </section>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          Aún no hay dos tiendas con el mismo código de repuesto. Cuando los
          vendedores carguen `partCode`, aparecerán aquí.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <article
              key={g.partCode}
              className="rounded-xl border border-border/60 bg-card/60 p-4"
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-primary">
                    {g.partCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {g.offers.length} ofertas · ${g.minPrice.toFixed(2)} – $
                    {g.maxPrice.toFixed(2)}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    g.spreadPct >= 25
                      ? "bg-red-500/15 text-red-700 dark:text-red-300"
                      : g.spreadPct >= 15
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  Spread {g.spreadPct}%
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-2 font-medium">Tienda</th>
                      <th className="pb-2 pr-2 font-medium">Producto</th>
                      <th className="pb-2 pr-2 font-medium">Sector</th>
                      <th className="pb-2 pr-2 text-right font-medium">Stock</th>
                      <th className="pb-2 text-right font-medium">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.offers.map((o) => (
                      <tr
                        key={o.partId}
                        className="border-b border-border/25 last:border-0"
                      >
                        <td className="py-2 pr-2">
                          <Link
                            href={`/tienda/${o.sellerId}`}
                            className="font-medium hover:text-primary"
                          >
                            {o.storeName}
                          </Link>
                        </td>
                        <td className="py-2 pr-2">
                          <Link
                            href={`/repuesto/${o.partId}`}
                            className="hover:text-primary"
                          >
                            {o.title}
                          </Link>
                          {o.partBrand && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({o.partBrand})
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-muted-foreground">
                          {o.location}
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums">
                          {o.stockQuantity}
                        </td>
                        <td
                          className={`py-2 text-right tabular-nums font-medium ${
                            o.price === g.minPrice
                              ? "text-emerald-600 dark:text-emerald-400"
                              : o.price === g.maxPrice && g.spreadPct >= 15
                                ? "text-red-600 dark:text-red-400"
                                : ""
                          }`}
                        >
                          ${o.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
