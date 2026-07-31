import { getStockStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StockBadgeProps {
  quantity: number;
  className?: string;
}

export function StockBadge({ quantity, className }: StockBadgeProps) {
  const status = getStockStatus(quantity);

  const styles = {
    disponible:
      "bg-emerald-600/90 text-white",
    ultimas:
      "bg-amber-500/90 text-white",
    agotado:
      "bg-red-600/90 text-white",
  } as const;

  const labels = {
    disponible: `Stock ${quantity}`,
    ultimas: `Últimas ${quantity}`,
    agotado: "Agotado",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide shadow-sm",
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
