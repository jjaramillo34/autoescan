import type { Metadata } from "next";
import { getAdminSellers, getAiControlData } from "@/lib/admin/metrics";
import { savePlatformSettingsAction } from "@/lib/admin/actions";
import { UPSELLS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Impulsos" };

export default async function AdminImpulsosPage() {
  const [data, sellers] = await Promise.all([
    getAiControlData(),
    getAdminSellers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl tracking-wide">Impulsos (upsell)</h2>
        <p className="text-sm text-muted-foreground">
          Destacados, prioridad IA y banner en home — ingresos extra sobre la
          suscripción.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Object.values(UPSELLS).map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-primary/30 bg-card/70 p-4"
          >
            <p className="font-heading text-xl tracking-wide">{u.name}</p>
            <p className="mt-1 text-2xl text-primary">
              ${u.priceUsd}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {u.periodLabel}
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{u.description}</p>
          </div>
        ))}
      </div>

      <form
        action={savePlatformSettingsAction}
        className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4"
      >
        <h3 className="font-heading text-lg">Banner en home</h3>
        <p className="text-xs text-muted-foreground">
          Incluye logo (iniciales de la tienda), mensaje, WhatsApp directo y
          enlace a sus productos.
        </p>
        <input
          type="hidden"
          name="geminiCostPerRequest"
          value={data.settings.geminiCostPerRequest}
        />
        <input
          type="hidden"
          name="aiCostAlertPercent"
          value={data.settings.aiCostAlertPercent}
        />
        <input
          type="hidden"
          name="aiRateLimitPerIpHour"
          value={data.settings.aiRateLimitPerIpHour}
        />
        <input
          type="hidden"
          name="billingProvider"
          value={data.settings.billingProvider}
        />
        <div className="space-y-1.5">
          <Label htmlFor="homeBannerSellerId">Tienda destacada</Label>
          <select
            id="homeBannerSellerId"
            name="homeBannerSellerId"
            defaultValue={data.settings.homeBannerSellerId ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Seleccionar vendedor…</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.storeName} — {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="homeBannerText">Mensaje promocional</Label>
          <Input
            id="homeBannerText"
            name="homeBannerText"
            defaultValue={data.settings.homeBannerText ?? ""}
            placeholder="Ej. Envíos en Tungurahua · Stock de frenos esta semana"
          />
        </div>
        <Button type="submit">Publicar banner</Button>
      </form>

      <div className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Vendedores con prioridad IA</p>
        <ul className="mt-2 space-y-1">
          {sellers
            .filter((s) => s.aiPriority)
            .map((s) => (
              <li key={s.id}>
                {s.storeName} — plan {s.planId}
              </li>
            ))}
          {sellers.filter((s) => s.aiPriority).length === 0 && (
            <li>Ninguno por ahora. Asigna plan Pro/Empresa.</li>
          )}
        </ul>
        <p className="mt-3 text-xs">
          En el catálogo, sellers con <code>aiPriority</code> y productos{" "}
          <code>isFeatured</code> aparecen primero.
        </p>
      </div>
    </div>
  );
}
