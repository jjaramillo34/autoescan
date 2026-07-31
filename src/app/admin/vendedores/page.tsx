import type { Metadata } from "next";
import { getAdminSellers } from "@/lib/admin/metrics";
import { SellerRowActions } from "@/components/admin/seller-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gestión de vendedores" };

export default async function AdminVendedoresPage() {
  const sellers = await getAdminSellers();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl tracking-wide">Vendedores</h2>
        <p className="text-sm text-muted-foreground">
          Aprobar, pausar o banear tiendas. Plan, cobro, límites y créditos IA.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tienda</TableHead>
              <TableHead>Plan / créditos</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Margen IA</TableHead>
              <TableHead>Gestión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.map((s) => {
              const remaining = Math.max(
                0,
                s.aiCreditsIncluded + s.aiCreditsExtra - s.aiCreditsUsed,
              );
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-medium">{s.storeName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary">{s.storeStatus}</Badge>
                      <Badge variant="outline">{s.billingStatus}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{PLANS[s.planId].name}</p>
                    <p className="text-muted-foreground">
                      IA: {s.aiCreditsUsed}/{s.aiCreditsIncluded + s.aiCreditsExtra}{" "}
                      (quedan {remaining})
                    </p>
                    {s.currentPeriodEnd && (
                      <p className="text-xs text-muted-foreground">
                        Cobro:{" "}
                        {new Date(s.currentPeriodEnd).toLocaleDateString("es-EC")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.productCount}/{s.productLimit}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>Ingreso ~${s.revenueUsd}</p>
                    <p className="text-muted-foreground">
                      Costo IA ~${s.estimatedAiCostUsd.toFixed(3)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <SellerRowActions seller={s} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
