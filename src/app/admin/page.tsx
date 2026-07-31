import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/admin/stat-card";
import { getFinancialDashboard } from "@/lib/admin/metrics";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard financiero",
};

export default async function AdminDashboardPage() {
  const d = await getFinancialDashboard();

  return (
    <div className="space-y-6">
      {d.aiAlert && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          Alerta: el costo de Gemini este mes supera el {d.aiAlertPercent}% de
          los ingresos. Revisa créditos IA o sube precios de plan.
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="ARR"
          value={`$${d.arr.toFixed(0)}`}
          hint={`Anual · ~$${d.mrr.toFixed(0)}/mes equiv.`}
          tone="success"
        />
        <StatCard
          label="Vendedores activos"
          value={d.activeSellers}
          hint={`${d.pendingSellers} pendientes de aprobación`}
        />
        <StatCard
          label="Churn / riesgo"
          value={`${d.churnRate}%`}
          hint="past_due + cancelados / total"
          tone={d.churnRate > 20 ? "warning" : "default"}
        />
        <StatCard
          label="Margen del mes"
          value={`${d.marginPercent}%`}
          hint={`Ingresos $${d.revenueMonth} − IA $${d.geminiCostMonth}`}
          tone={d.marginPercent < 70 ? "warning" : "success"}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Costo Gemini (mes)"
          value={`$${d.geminiCostMonth.toFixed(3)}`}
          hint={`${d.aiRequestsMonth} requests`}
        />
        <StatCard
          label="Requests IA hoy"
          value={d.aiRequestsToday}
          hint={`${d.aiRequestsMonth} en el mes`}
        />
        <StatCard
          label="Clicks WhatsApp"
          value={d.whatsappClicks}
          hint="Contactos generados"
        />
        <StatCard
          label="Conversión foto → WA"
          value={`${d.conversionPhotoToWa}%`}
          hint={`${d.aiSearches} búsquedas IA`}
          tone="success"
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link href="/admin/vendedores">Gestionar vendedores</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/admin/ia">Control de IA</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/admin/billing">Billing e facturas</Link>
        </Button>
      </div>
    </div>
  );
}
