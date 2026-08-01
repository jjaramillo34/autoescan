import { Camera, MessageCircle, Search } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Busca",
    text: "Por foto, vehículo o categoría.",
    icon: Camera,
  },
  {
    n: "02",
    title: "Elige",
    text: "Compara locales cerca en Ambato.",
    icon: Search,
  },
  {
    n: "03",
    title: "WhatsApp",
    text: "Escribes al local. Pagas ahí.",
    icon: MessageCircle,
  },
] as const;

export function HowItWorks() {
  return (
    <section className="space-y-6" aria-labelledby="como-funciona-title">
      <div className="space-y-1 text-center sm:text-left">
        <h2
          id="como-funciona-title"
          className="font-heading text-2xl tracking-wide sm:text-3xl"
        >
          Cómo funciona
        </h2>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:mx-0">
          Tres pasos. Sin intermediarios: AutoEscán te conecta con el local.
        </p>
      </div>

      <ol className="grid gap-6 sm:grid-cols-3 sm:gap-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.n} className="relative space-y-3 text-center sm:text-left">
              {index < STEPS.length - 1 && (
                <span
                  className="pointer-events-none absolute left-[calc(50%+2.5rem)] top-7 hidden h-px w-[calc(100%-3rem)] bg-gradient-to-r from-primary/40 to-transparent sm:block"
                  aria-hidden
                />
              )}
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 sm:mx-0">
                <Icon className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
                  Paso {step.n}
                </p>
                <p className="font-heading text-xl tracking-wide">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
