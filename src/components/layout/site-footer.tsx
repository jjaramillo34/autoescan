import Link from "next/link";
import { ScanSearch } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 10% 20%, oklch(0.55 0.12 45 / 0.18), transparent), radial-gradient(ellipse 50% 40% at 90% 80%, oklch(0.45 0.06 250 / 0.12), transparent)",
          }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 pb-28 md:grid-cols-[1.4fr_1fr] md:items-end md:pb-10 md:py-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                <ScanSearch className="size-4" />
              </span>
              <p className="font-heading text-2xl tracking-wide text-foreground">
                Auto<span className="text-primary">Escán</span>
              </p>
            </div>

            <p className="max-w-md font-heading text-lg tracking-wide text-foreground sm:text-xl">
              Escanea y encuentra repuestos en Ambato.
            </p>

            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Tecnología rápida y profesional: diagnóstico visual + catálogo
              inteligente para conectar compradores con locales reales en
              Tungurahua.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:items-end">
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground sm:justify-end">
              <Link
                href="/buscar-por-imagen"
                className="transition-colors hover:text-primary"
              >
                Buscar por foto
              </Link>
              <Link
                href="/tiendas"
                className="transition-colors hover:text-primary"
              >
                Tiendas
              </Link>
              <Link
                href="/registro-vendedor"
                className="transition-colors hover:text-primary"
              >
                Vender
              </Link>
              <Link
                href="/privacidad"
                className="transition-colors hover:text-primary"
              >
                Privacidad
              </Link>
              <Link
                href="/terminos"
                className="transition-colors hover:text-primary"
              >
                Términos
              </Link>
            </nav>
            <p className="text-xs text-muted-foreground/80 sm:text-right">
              Piloto · Ambato, Tungurahua · Ecuador
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
