import Link from "next/link";
import { MapPin, MessageCircle, Store, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECTORES_AMBATO } from "@/lib/constants";

const POINTS = [
  {
    icon: MapPin,
    title: "Sectores de Ambato",
    text: SECTORES_AMBATO.slice(0, 5).join(" · "),
  },
  {
    icon: MessageCircle,
    title: "WhatsApp directo",
    text: "Hablas con el local. Sin intermediarios ni esperas.",
  },
  {
    icon: Wallet,
    title: "Pago en el local",
    text: "Acuerdas precio y retiro o entrega con la tienda.",
  },
] as const;

export function LocalTrust() {
  return (
    <section className="border-y border-border/50 py-12">
      <div className="mx-auto max-w-6xl space-y-10 px-4">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h2 className="font-heading text-2xl tracking-wide sm:text-3xl">
            Hecho para Ambato
          </h2>
          <p className="text-muted-foreground">
            Marketplace de repuestos en Tungurahua: catálogo online, trato en el
            local.
          </p>
        </div>

        <ul className="grid gap-8 sm:grid-cols-3">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <li key={point.title} className="space-y-2 text-center sm:text-left">
                <p className="inline-flex items-center gap-2 font-heading text-lg tracking-wide">
                  <Icon className="size-4 text-primary" />
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
          <Button asChild size="lg" variant="secondary">
            <Link href="/registro-vendedor">Publicar mi tienda</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
