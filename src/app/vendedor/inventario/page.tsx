import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryPanel } from "@/components/seller/inventory-panel";
import { getSellerParts } from "@/lib/parts-service";
import { isDatabaseConfigured } from "@/lib/db";
import { requireSellerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventario del vendedor",
  description: "Gestiona stock y precios de tus repuestos en Ambato.",
};

export default async function InventarioPage() {
  const session = await requireSellerSession();
  if (!session) {
    redirect("/iniciar-sesion?callbackUrl=/vendedor/inventario");
  }

  const parts = await getSellerParts(session.user.id);
  const usingDemo = !isDatabaseConfigured();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {session.user.storeName || "Panel vendedor"}
          </p>
          <h1 className="font-heading text-3xl tracking-wide">
            Mi inventario
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Busca por código, ajusta stock y exporta tu catálogo.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/vendedor/nuevo-repuesto">
            <PlusCircle className="size-4" />
            Cargar productos
          </Link>
        </Button>
      </div>

      {usingDemo && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
          Los cambios se guardan en memoria (modo demo). Conecta MongoDB para
          persistencia.
        </p>
      )}

      <InventoryPanel parts={parts} />
    </div>
  );
}
