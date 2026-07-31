import Link from "next/link";
import {
  AlertTriangle,
  MessageCircle,
  MessageSquareText,
  Package,
  Sparkles,
  Star,
  Store,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SellerInsightsPanel } from "@/components/seller/seller-insights";
import type { SellerDashboardDTO } from "@/lib/seller-dashboard";
import { buildStockAlertWhatsAppUrl } from "@/lib/whatsapp";

interface SellerDashboardProps {
  data: SellerDashboardDTO;
  sellerId: string;
  sellerPhone: string;
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "green" | "amber" | "red" | "blue";
}) {
  const tones = {
    default: "border-border/60 bg-card/60",
    green: "border-emerald-500/25 bg-emerald-500/10",
    amber: "border-amber-500/25 bg-amber-500/10",
    red: "border-red-500/25 bg-red-500/10",
    blue: "border-sky-500/25 bg-sky-500/10",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl tracking-wide">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SellerDashboard({
  data,
  sellerId,
  sellerPhone,
}: SellerDashboardProps) {
  const stockWa =
    data.lowStock.length > 0
      ? buildStockAlertWhatsAppUrl({
          phone: sellerPhone,
          storeName: data.storeName,
          items: data.lowStock,
        })
      : null;

  const creditPct = Math.min(
    100,
    Math.round(
      (data.aiCredits.used /
        Math.max(1, data.aiCredits.included + data.aiCredits.extra)) *
        100,
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/vendedor/nuevo-repuesto">
            <Package className="size-3.5" />
            Cargar producto
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/vendedor/inventario">Ver inventario</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/vendedor/respuestas">
            <MessageSquareText className="size-3.5" />
            Respuestas WA
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/vendedor/impulsos">
            <Zap className="size-3.5" />
            Planes e impulsos
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/vendedor/perfil">
            <Store className="size-3.5" />
            Perfil de tienda
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost" className="gap-1.5">
          <Link href={`/tienda/${sellerId}`} target="_blank">
            Ver tienda pública
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Plan"
          value={data.planName}
          hint={`${data.productCount}/${data.productLimit} productos`}
        />
        <StatCard
          label="Vistas (7 días)"
          value={data.views.last7Days}
          hint={`${data.views.total} total`}
        />
        <StatCard
          label="WhatsApp (7 días)"
          value={data.whatsapp.last7Days}
          hint={`${data.whatsapp.total} total`}
          tone="green"
        />
        <StatCard
          label="Vista → WA"
          value={`${data.views.conversionViewToWa}%`}
          hint="Conversión últimos 7 días"
          tone={
            data.views.conversionViewToWa >= 20
              ? "green"
              : data.views.conversionViewToWa >= 10
                ? "amber"
                : "default"
          }
        />
        <StatCard
          label="Créditos IA"
          value={data.aiCredits.remaining}
          hint={`${data.aiCredits.used} usados · ${data.aiCredits.included + data.aiCredits.extra} cuota`}
          tone="blue"
        />
        <StatCard
          label="Destacados"
          value={`${data.featuredUsed}/${data.featuredSlots}`}
          hint={
            data.featuredSlots === 0
              ? "Disponible en plan Pro"
              : "Slots de tu plan"
          }
          tone="amber"
        />
      </div>

      <SellerInsightsPanel data={data} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="size-4 text-[#25D366]" />
            <h2 className="font-heading text-lg tracking-wide">
              Consultas WhatsApp
            </h2>
          </div>
          {data.whatsapp.topParts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay clics registrados. Cuando un comprador pulse WhatsApp
              en tus productos, aparecerán aquí.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.whatsapp.topParts.map((row) => (
                <li
                  key={row.partId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2 text-sm"
                >
                  <Link
                    href={`/repuesto/${row.partId}`}
                    className="min-w-0 truncate font-medium hover:text-primary"
                  >
                    {row.title}
                  </Link>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {row.clicks} clic{row.clicks === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-heading text-lg tracking-wide">Créditos IA</h2>
          </div>
          {data.aiCredits.depleted && (
            <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              Cupo del mes agotado ({data.aiCredits.periodKey}). Se renueva el
              próximo mes o pide pack en Impulsos.
            </p>
          )}
          {!data.aiCredits.depleted && data.aiCredits.softWarned && (
            <p className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              Vas al {data.aiCredits.usagePercent}% del cupo mensual. Usa IA con
              criterio o amplía en Impulsos.
            </p>
          )}
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                data.aiCredits.depleted
                  ? "bg-red-500"
                  : data.aiCredits.softWarned
                    ? "bg-amber-500"
                    : "bg-primary"
              }`}
              style={{ width: `${creditPct}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Incluidos {data.aiCredits.included}
            {data.aiCredits.extra > 0
              ? ` + ${data.aiCredits.extra} extra`
              : ""}{" "}
            · periodo {data.aiCredits.periodKey}. Se consumen al generar
            descripciones con Gemini.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-muted/50 px-2 py-2">
              <p className="font-semibold">{data.disponibles}</p>
              <p className="text-muted-foreground">Disponibles</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 px-2 py-2">
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                {data.lowStock.length}
              </p>
              <p className="text-muted-foreground">Stock bajo</p>
            </div>
            <div className="rounded-lg bg-red-500/10 px-2 py-2">
              <p className="font-semibold text-red-700 dark:text-red-300">
                {data.outOfStockCount}
              </p>
              <p className="text-muted-foreground">Agotados</p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" />
            <h2 className="font-heading text-lg tracking-wide">
              Stock bajo
            </h2>
          </div>
          <div className="flex gap-2">
            {stockWa && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-1.5 border-[#25D366]/40 text-[#128C7E]"
              >
                <a href={stockWa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-3.5" />
                  Enviar alerta
                </a>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/vendedor/inventario">Gestionar</Link>
            </Button>
          </div>
        </div>
        {data.lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ningún producto con 1–3 unidades. Buen ritmo.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {data.lowStock.map((p) => (
              <li
                key={p._id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.title}</p>
                  {p.partCode && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {p.partCode}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-amber-700 dark:text-amber-300">
                    {p.stockQuantity} und.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${p.price.toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Star className="mt-0.5 size-5 text-primary" />
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-wide">
              Impulsar productos
            </h2>
            <p className="text-sm text-muted-foreground">
              Destaca hasta {data.featuredSlots} productos (plan {data.planName}
              ): {data.featuredUsed}/{data.featuredSlots} usados. También puedes
              pedir banner home o prioridad IA.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/vendedor/impulsos">Ver planes e impulsos</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/vendedor/inventario">Destacar en inventario</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
