import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PartCard } from "@/components/parts/part-card";
import { getParts } from "@/lib/parts-service";

export async function RecentPartsRail() {
  const recent = await getParts({
    sort: "recientes",
    page: 1,
    limit: 4,
  });

  if (recent.items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-primary">
            <Sparkles className="size-3.5" />
            Frescos en Ambato
          </p>
          <h2 className="font-heading text-2xl tracking-wide">
            Recién publicados
          </h2>
        </div>
        <Link
          href="/?sort=recientes#catalogo"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Ver todos
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recent.items.map((part, index) => (
          <PartCard key={part._id} part={part} index={index} />
        ))}
      </div>
    </section>
  );
}
