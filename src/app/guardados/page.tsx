import type { Metadata } from "next";
import Link from "next/link";
import { SavedPartsClient } from "@/components/parts/saved-parts-client";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Guardados",
  description: "Repuestos que marcaste como favoritos en AutoEscán.",
};

export default async function GuardadosPage() {
  const session = await auth();
  const loggedIn = Boolean(session?.user?.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-24 sm:py-10 md:pb-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
          Tu lista
        </p>
        <h1 className="font-heading text-3xl tracking-wide">Guardados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loggedIn
            ? "Sincronizados con tu cuenta en este y otros dispositivos."
            : (
              <>
                Se guardan en este dispositivo.{" "}
                <Link
                  href="/registro"
                  className="font-medium text-primary hover:underline"
                >
                  Crea una cuenta
                </Link>{" "}
                para sincronizarlos.
              </>
            )}
        </p>
      </div>
      <SavedPartsClient />
    </div>
  );
}
