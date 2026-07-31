import Link from "next/link";
import type { SellerInfo } from "@/lib/types";

export function StoreStatusBanner({
  storeStatus,
}: {
  storeStatus?: SellerInfo["storeStatus"];
}) {
  if (!storeStatus || storeStatus === "active") return null;

  if (storeStatus === "pending") {
    return (
      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        Tu tienda está <strong>en revisión</strong>. Puedes cargar inventario;
        cuando un admin la apruebe, aparecerá completa en el directorio.
      </div>
    );
  }

  if (storeStatus === "paused") {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
        Tu tienda está <strong>pausada</strong> y no aparece en el catálogo
        público. Escribe a soporte o revisa{" "}
        <Link href="/vendedor/impulsos" className="underline underline-offset-2">
          Impulsos / plan
        </Link>
        .
      </div>
    );
  }

  if (storeStatus === "banned") {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
        Tu tienda está <strong>suspendida</strong>. Contacta a AutoEscán para
        corregir datos y volver a solicitar aprobación.
      </div>
    );
  }

  return null;
}
