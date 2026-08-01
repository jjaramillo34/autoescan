import Image from "next/image";
import { Camera, Check, Lightbulb, Maximize2, X } from "lucide-react";

const TIPS = [
  {
    ok: true,
    text: "Pieza completa y centrada (cuerpo, conector, hilos)",
  },
  {
    ok: true,
    text: "Fondo claro y limpio, buena luz",
  },
  {
    ok: true,
    text: "De cerca, sin sombra fuerte ni blur",
  },
  {
    ok: false,
    text: "Evita fotos borrosas, muy lejos o con varias piezas",
  },
] as const;

export function PhotoGuide() {
  return (
    <section
      className="space-y-4 rounded-xl border border-border/60 bg-card/50 p-4"
      aria-labelledby="photo-guide-title"
    >
      <div className="flex items-start gap-2">
        <Camera className="mt-0.5 size-5 text-primary" />
        <div>
          <h2
            id="photo-guide-title"
            className="font-heading text-lg tracking-wide"
          >
            Cómo tomar la foto
          </h2>
          <p className="text-sm text-muted-foreground">
            Así la IA reconoce mejor el repuesto. Ejemplo: sensor de oxígeno.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_1.1fr] sm:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-xl border border-border/50 bg-white">
          <Image
            src="/examples/photo-guide-sensor.png"
            alt="Ejemplo: sensor de oxígeno sobre fondo blanco, pieza completa y nítida"
            fill
            className="object-contain p-3"
            sizes="220px"
            priority={false}
          />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
            <Check className="size-3" />
            Buena foto
          </span>
        </div>

        <ul className="space-y-2.5">
          {TIPS.map((tip) => (
            <li key={tip.text} className="flex gap-2 text-sm">
              {tip.ok ? (
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-red-500" />
              )}
              <span
                className={
                  tip.ok ? "text-foreground" : "text-muted-foreground"
                }
              >
                {tip.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Lightbulb className="size-3 text-primary" />
          Usa la cámara del celular o sube desde la galería
        </span>
        <span className="inline-flex items-center gap-1">
          <Maximize2 className="size-3 text-primary" />
          Máx. 8 MB · JPG, PNG o WEBP
        </span>
      </div>
    </section>
  );
}
