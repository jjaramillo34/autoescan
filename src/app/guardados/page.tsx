import type { Metadata } from "next";
import { SavedPartsClient } from "@/components/parts/saved-parts-client";

export const metadata: Metadata = {
  title: "Guardados",
  description: "Repuestos que marcaste como favoritos en AutoEscán.",
};

export default function GuardadosPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-24 sm:py-10 md:pb-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
          Tu lista
        </p>
        <h1 className="font-heading text-3xl tracking-wide">Guardados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Se guardan en este dispositivo. No necesitas cuenta.
        </p>
      </div>
      <SavedPartsClient />
    </div>
  );
}
