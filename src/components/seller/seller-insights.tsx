"use client";

import Link from "next/link";
import { Clock, Download, Ghost, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SellerDashboardDTO } from "@/lib/seller-dashboard";

interface SellerInsightsProps {
  data: SellerDashboardDTO;
}

function MiniBars({
  values,
  colorClass,
}: {
  values: number[];
  colorClass: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-16 items-end gap-px">
      {values.map((v, i) => (
        <div
          key={i}
          className={`min-w-0 flex-1 rounded-t-sm ${colorClass}`}
          style={{ height: `${Math.max(4, Math.round((v / max) * 100))}%` }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

function exportCsv(data: SellerDashboardDTO) {
  const lines: string[] = [];
  lines.push("seccion,campo,valor");
  lines.push(`resumen,vistas_7d,${data.views.last7Days}`);
  lines.push(`resumen,vistas_total,${data.views.total}`);
  lines.push(`resumen,whatsapp_7d,${data.whatsapp.last7Days}`);
  lines.push(`resumen,whatsapp_total,${data.whatsapp.total}`);
  lines.push(`resumen,conversion_vista_wa,${data.views.conversionViewToWa}%`);
  lines.push(`resumen,vistas_30d,${data.insights.views30Days}`);
  lines.push(`resumen,whatsapp_30d,${data.insights.whatsapp30Days}`);

  for (const d of data.insights.daily) {
    lines.push(`tendencia,${d.date},vistas=${d.views};wa=${d.whatsapp}`);
  }
  for (const p of data.whatsapp.topParts) {
    lines.push(
      `top_whatsapp,"${p.title.replace(/"/g, '""')}",${p.clicks}`,
    );
  }
  for (const p of data.insights.deadProducts) {
    lines.push(
      `sin_clicks,"${p.title.replace(/"/g, '""')}",vistas30=${p.views30}`,
    );
  }
  for (const g of data.insights.demandGaps) {
    lines.push(
      `demanda_sin_stock,"${g.query.replace(/"/g, '""')}",${g.marketCount}`,
    );
  }

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `autoescan-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SellerInsightsPanel({ data }: SellerInsightsProps) {
  const { insights } = data;
  const last7 = insights.daily.slice(-7);
  const views7 = last7.reduce((s, d) => s + d.views, 0);
  const wa7 = last7.reduce((s, d) => s + d.whatsapp, 0);
  const viewsPrev = insights.daily.slice(-14, -7).reduce((s, d) => s + d.views, 0);
  const waPrev = insights.daily.slice(-14, -7).reduce((s, d) => s + d.whatsapp, 0);

  const viewsDelta =
    viewsPrev > 0 ? Math.round(((views7 - viewsPrev) / viewsPrev) * 100) : null;
  const waDelta =
    waPrev > 0 ? Math.round(((wa7 - waPrev) / waPrev) * 100) : null;

  const topPeak = [...insights.peakHours]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 3)
    .filter((h) => h.clicks > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <h2 className="font-heading text-lg tracking-wide">
            Rendimiento 30 días
          </h2>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => exportCsv(data)}
        >
          <Download className="size-3.5" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Vistas / día</p>
              <p className="font-heading text-xl tracking-wide">
                {insights.views30Days}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  en 30 días
                </span>
              </p>
            </div>
            {viewsDelta !== null && (
              <span
                className={
                  viewsDelta >= 0
                    ? "text-xs font-medium text-emerald-600"
                    : "text-xs font-medium text-red-600"
                }
              >
                {viewsDelta >= 0 ? "+" : ""}
                {viewsDelta}% vs sem. ant.
              </span>
            )}
          </div>
          <MiniBars
            values={insights.daily.map((d) => d.views)}
            colorClass="bg-sky-500/70"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Últimos 30 días · Ecuador (hora Ambato)
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">WhatsApp / día</p>
              <p className="font-heading text-xl tracking-wide">
                {insights.whatsapp30Days}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  en 30 días
                </span>
              </p>
            </div>
            {waDelta !== null && (
              <span
                className={
                  waDelta >= 0
                    ? "text-xs font-medium text-emerald-600"
                    : "text-xs font-medium text-red-600"
                }
              >
                {waDelta >= 0 ? "+" : ""}
                {waDelta}% vs sem. ant.
              </span>
            )}
          </div>
          <MiniBars
            values={insights.daily.map((d) => d.whatsapp)}
            colorClass="bg-[#25D366]/80"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Comparado con la semana anterior
          </p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h3 className="font-heading text-base tracking-wide">
              Horarios pico
            </h3>
          </div>
          {topPeak.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay suficientes clics para detectar picos.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topPeak.map((h) => (
                <li
                  key={h.hour}
                  className="flex items-center justify-between gap-2"
                >
                  <span>
                    {String(h.hour).padStart(2, "0")}:00 –{" "}
                    {String(h.hour).padStart(2, "0")}:59
                  </span>
                  <span className="tabular-nums text-primary">
                    {h.clicks} WA
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex h-10 items-end gap-px">
            {insights.peakHours.map((h) => {
              const max = Math.max(1, ...insights.peakHours.map((x) => x.clicks));
              return (
                <div
                  key={h.hour}
                  className="min-w-0 flex-1 rounded-t-sm bg-primary/60"
                  style={{
                    height: `${Math.max(2, Math.round((h.clicks / max) * 100))}%`,
                  }}
                  title={`${h.hour}:00 → ${h.clicks}`}
                />
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border/60 bg-card/50 p-4 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Ghost className="size-4 text-amber-600" />
            <h3 className="font-heading text-base tracking-wide">
              Productos sin consultas (30 días)
            </h3>
          </div>
          {insights.deadProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todos tus productos activos recibieron al menos un WhatsApp.
            </p>
          ) : (
            <ul className="divide-y divide-border/50">
              {insights.deadProducts.map((p) => (
                <li
                  key={p.partId}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/repuesto/${p.partId}`}
                      className="truncate font-medium hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {p.views30} vistas · ${p.price.toFixed(2)} ·{" "}
                      {p.stockQuantity} und.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/vendedor/inventario">Revisar</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Search className="size-4 text-primary" />
          <h3 className="font-heading text-base tracking-wide">
            Demanda del marketplace que no cubres
          </h3>
        </div>
        {insights.demandGaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tu inventario cubre las búsquedas más frecuentes, o aún no hay
            suficientes búsquedas registradas.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {insights.demandGaps.map((g) => (
              <li
                key={g.query}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2 text-sm"
              >
                <span className="font-medium">&ldquo;{g.query}&rdquo;</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {g.marketCount} búsquedas
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/vendedor/nuevo-repuesto">Cargar producto faltante</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
