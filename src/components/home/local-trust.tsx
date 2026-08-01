import Link from "next/link";
import { BadgeDollarSign, MessageCircle, Store, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";

const POINTS = [
  {
    icon: BadgeDollarSign,
    title: "Consulta gratis",
    text: "Ver el catálogo y escribir al local no tiene costo en AutoEscán.",
  },
  {
    icon: UserRoundX,
    title: "Sin registro obligatorio",
    text: "Buscas y contactas por WhatsApp. La cuenta es opcional para favoritos.",
  },
  {
    icon: MessageCircle,
    title: "Pagas en el local",
    text: "Cierras precio, retiro o entrega directo con la tienda.",
  },
] as const;

export function LocalTrust() {
  return (
    <section className="relative overflow-hidden border-y border-border/50 py-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.55 0.12 45 / 0.12), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl space-y-10 px-4">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h2 className="font-heading text-2xl tracking-wide sm:text-3xl">
            Hecho para Ambato
          </h2>
          <p className="text-muted-foreground">
            Tecnología rápida, trato de barrio: escanea, encuentra y habla con
            el local.
          </p>
        </div>

        <ul className="grid gap-8 sm:grid-cols-3">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <li key={point.title} className="space-y-3 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <Icon className="size-5" />
                </span>
                <p className="font-heading text-lg tracking-wide">
                  {point.title}
                </p>
                <p className="text-sm text-muted-foreground">{point.text}</p>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col items-center gap-3 border-t border-border/50 pt-8 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="size-4 text-accent" />
            ¿Tienes un local de repuestos en Ambato?
          </p>
          <Button asChild size="lg">
            <Link href="/registro-vendedor">Publicar mi tienda</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
