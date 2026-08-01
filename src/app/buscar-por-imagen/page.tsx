import type { Metadata } from "next";
import { ImageSearch } from "@/components/ai/image-search";

export const metadata: Metadata = {
  title: "Buscar por imagen",
  description:
    "Sube una foto de la autoparte y deja que Gemini la identifique para buscar en el inventario local de Ambato.",
};

export default function BuscarPorImagenPage() {
  return (
    <div className="relative pb-20 md:pb-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.55 0.12 50 / 0.35), transparent), url('https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1600&q=60')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          maskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-xl space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Inteligencia artificial
          </p>
          <h1 className="font-heading text-3xl tracking-wide sm:text-5xl">
            Buscar por imagen
          </h1>
          <p className="text-muted-foreground">
            Indica tu vehículo, toma o sube una foto clara de la pieza y
            encuentra el repuesto compatible en Ambato.
          </p>
        </div>

        <ImageSearch />
      </div>
    </div>
  );
}
