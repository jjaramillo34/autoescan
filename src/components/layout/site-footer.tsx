import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 py-8 pb-24 md:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>
            <span className="font-heading tracking-wide text-foreground">
              AutoEscán
            </span>{" "}
            — Marketplace de repuestos en Ecuador
          </p>
          <p className="text-xs">Piloto inicial: Ambato, Tungurahua</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link href="/tiendas" className="hover:text-primary">
            Tiendas
          </Link>
          <Link href="/privacidad" className="hover:text-primary">
            Privacidad
          </Link>
          <Link href="/terminos" className="hover:text-primary">
            Términos
          </Link>
        </nav>
      </div>
    </footer>
  );
}
