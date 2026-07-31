import type { Metadata } from "next";
import Link from "next/link";
import { getMarketplaceAnalytics } from "@/lib/admin/metrics";
import { StatCard } from "@/components/admin/stat-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics" };

function alertTone(severity: "warning" | "danger" | "info") {
  if (severity === "danger") return "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200";
  if (severity === "warning")
    return "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200";
  return "border-border/60 bg-muted/40 text-muted-foreground";
}

export default async function AdminAnalyticsPage() {
  const a = await getMarketplaceAnalytics();
  const maxDemand = Math.max(1, ...a.demandMap.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl tracking-wide">
          Analytics de marketplace
        </h2>
        <p className="text-sm text-muted-foreground">
          Demanda real en Ambato para vender el plan Pro a los locales correctos.
        </p>
      </div>

      {a.opsAlerts.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-heading text-lg">Alertas operativas</h3>
          <ul className="space-y-2">
            {a.opsAlerts.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-lg border px-3 py-2 text-sm ${alertTone(alert.severity)}`}
              >
                {alert.message}
                {alert.id === "reported" && (
                  <Link
                    href="/admin/moderacion"
                    className="ml-2 underline underline-offset-2"
                  >
                    Ver moderación
                  </Link>
                )}
                {alert.id === "pending-payments" && (
                  <Link
                    href="/admin/billing"
                    className="ml-2 underline underline-offset-2"
                  >
                    Ver billing
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Búsquedas IA" value={a.aiSearches} />
        <StatCard label="Vistas producto" value={a.partViews} />
        <StatCard label="Favoritos" value={a.favorites} />
        <StatCard label="Clicks WhatsApp" value={a.whatsappClicks} />
        <StatCard
          label="Vista → WA"
          value={`${a.conversionViewToWa}%`}
          tone="success"
        />
        <StatCard label="Foto IA → WA" value={`${a.conversionPhotoToWa}%`} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tiendas activas"
          value={a.health.activeStores}
          hint={`${a.health.pendingStores} pendientes`}
        />
        <StatCard
          label="Con logo"
          value={`${a.health.storesWithLogoPct}%`}
          hint="De tiendas activas"
        />
        <StatCard
          label="Catálogo activo"
          value={a.health.totalActiveParts}
          hint={`${a.health.outOfStockPct}% agotado`}
          tone={a.health.outOfStockPct >= 25 ? "warning" : "default"}
        />
        <StatCard
          label="Créditos IA usados"
          value={`${a.health.aiCreditsBurnedPct}%`}
          hint="Sobre cuota + extras"
          tone={a.health.aiCreditsBurnedPct >= 85 ? "warning" : "default"}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <h3 className="font-heading text-lg">Mapa de demanda Ambato</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sector × marca / modelo (vistas, búsquedas y WhatsApp)
          </p>
          <ul className="mt-3 space-y-2.5">
            {a.demandMap.map((d) => (
              <li key={`${d.sector}-${d.brand}-${d.model}`} className="text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span>
                    <span className="text-muted-foreground">{d.sector}</span>
                    {" · "}
                    <span className="font-medium">
                      {d.brand} {d.model}
                    </span>
                  </span>
                  <span className="tabular-nums text-primary">{d.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{
                      width: `${Math.max(8, Math.round((d.count / maxDemand) * 100))}%`,
                    }}
                  />
                </div>
              </li>
            ))}
            {a.demandMap.length === 0 && (
              <li className="py-4 text-center text-sm text-muted-foreground">
                Sin cruce sector/marca todavía
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <h3 className="font-heading text-lg">Calidad de catálogo</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Productos activos que conviene limpiar
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Sin foto</span>
              <span className="font-medium text-primary">
                {a.catalogQuality.withoutPhoto}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Sin código OEM/SKU</span>
              <span className="font-medium text-primary">
                {a.catalogQuality.withoutCode}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Precio outlier (vs categoría)</span>
              <span className="font-medium text-primary">
                {a.catalogQuality.priceOutliers}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Pendientes de revisión</span>
              <span className="font-medium text-primary">
                {a.catalogQuality.pendingReview}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Reportados</span>
              <span className="font-medium text-primary">
                {a.catalogQuality.reported}
              </span>
            </li>
          </ul>
          <Link
            href="/admin/moderacion"
            className="mt-4 inline-block text-sm text-primary underline underline-offset-2"
          >
            Ir a moderación
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <h3 className="font-heading text-lg">Ranking de tiendas</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Por consultas WhatsApp y vistas de producto
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">Tienda</th>
                  <th className="pb-2 pr-2 font-medium">Sector</th>
                  <th className="pb-2 pr-2 text-right font-medium">Vistas</th>
                  <th className="pb-2 pr-2 text-right font-medium">WA</th>
                  <th className="pb-2 text-right font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {a.storeRanking.map((s) => (
                  <tr
                    key={s.sellerId}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="py-2 pr-2 font-medium">{s.storeName}</td>
                    <td className="py-2 pr-2 text-muted-foreground">
                      {s.sector}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {s.views}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums text-primary">
                      {s.whatsapp}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {s.conversion}%
                    </td>
                  </tr>
                ))}
                {a.storeRanking.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Aún no hay eventos suficientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <h3 className="font-heading text-lg">Demanda por sector</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vistas y WhatsApp según ubicación del repuesto
          </p>
          <ul className="mt-3 space-y-2">
            {a.demandBySector.map((s) => (
              <li
                key={s.sector}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>{s.sector}</span>
                <span className="shrink-0 text-muted-foreground">
                  <span className="text-foreground">{s.views}</span> vistas ·{" "}
                  <span className="font-medium text-primary">{s.whatsapp}</span>{" "}
                  WA
                </span>
              </li>
            ))}
            {a.demandBySector.length === 0 && (
              <li className="py-4 text-center text-sm text-muted-foreground">
                Sin datos de sector todavía
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <h3 className="font-heading text-lg">Búsquedas top</h3>
          <ul className="mt-3 space-y-2">
            {a.topSearches.map((s) => (
              <li
                key={s.query}
                className="flex items-center justify-between text-sm"
              >
                <span>{s.query}</span>
                <span className="font-medium text-primary">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <h3 className="font-heading text-lg">Marcas / modelos demandados</h3>
          <ul className="mt-3 space-y-2">
            {a.topVehicles.map((v) => (
              <li
                key={`${v.brand}-${v.model}`}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {v.brand} {v.model}
                </span>
                <span className="font-medium text-primary">{v.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
