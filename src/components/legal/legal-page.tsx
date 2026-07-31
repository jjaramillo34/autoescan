import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LegalPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 pb-24 sm:py-10 md:pb-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/">
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>
      </Button>

      <header className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
          AutoEscán · Piloto Ambato
        </p>
        <h1 className="font-heading text-3xl tracking-wide sm:text-4xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Última actualización: {updated}
        </p>
      </header>

      <div className="prose-legal space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:tracking-wide [&_h2]:text-foreground [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}
