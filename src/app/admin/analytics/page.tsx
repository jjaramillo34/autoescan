import type { Metadata } from "next";
import { getMarketplaceAnalytics } from "@/lib/admin/metrics";
import { StatCard } from "@/components/admin/stat-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const a = await getMarketplaceAnalytics();

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

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Búsquedas IA" value={a.aiSearches} />
        <StatCard label="Clicks WhatsApp" value={a.whatsappClicks} />
        <StatCard
          label="Conversión foto → WA"
          value={`${a.conversionPhotoToWa}%`}
          tone="success"
        />
      </section>

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
