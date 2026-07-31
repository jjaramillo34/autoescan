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
    <section className="space-y-4" aria-labelledby="como-funciona-title">
      <div className="space-y-1">
        <h2
          id="como-funciona-title"
          className="font-heading text-2xl tracking-wide sm:text-3xl"
        >
          Cómo funciona
        </h2>
        <p className="max-w-lg text-sm text-muted-foreground">
          AutoEscán te conecta con el local. El trato es directo por WhatsApp.
        </p>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.n}
              className="flex gap-3 border-t border-primary/25 pt-4 sm:flex-col sm:gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm tracking-wide text-primary">
                  {step.n}
                </span>
                <Icon className="size-4 text-muted-foreground sm:hidden" />
              </div>
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-heading text-lg tracking-wide">
                  <Icon className="hidden size-4 text-primary sm:inline" />
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
