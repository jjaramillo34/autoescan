"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  CircleDot,
  Cog,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SHORTCUTS: { label: string; category: string; icon: LucideIcon }[] = [
  { label: "Motor", category: "Motor", icon: Cog },
  { label: "Frenos", category: "Frenos", icon: CircleDot },
  { label: "Suspensión", category: "Suspensión", icon: ArrowUpDown },
  { label: "Eléctrico", category: "Eléctrico", icon: Zap },
];

export function CategoryShortcuts() {
  const searchParams = useSearchParams();
  const active = searchParams.get("category");

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
      {SHORTCUTS.map((item, i) => {
        const Icon = item.icon;
        const isActive = active === item.category;
        const href = `/?category=${encodeURIComponent(item.category)}#catalogo`;

        return (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            className="min-w-[140px] flex-1 sm:min-w-0"
          >
            <Link
              href={href}
              className={cn(
                "group flex h-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                isActive
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/35 hover:bg-card/70 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-primary group-hover:bg-primary/20",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="font-heading text-base tracking-wide">
                {item.label}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
