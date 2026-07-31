"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Heart, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Catálogo", icon: Package, match: (p: string) => p === "/" },
  {
    href: "/buscar-por-imagen",
    label: "Foto",
    icon: Camera,
    match: (p: string) => p.startsWith("/buscar-por-imagen"),
  },
  {
    href: "/guardados",
    label: "Guardados",
    icon: Heart,
    match: (p: string) => p.startsWith("/guardados"),
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/vendedor")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-2 text-xs transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("size-5", active && tab.href === "/guardados" && "fill-current")} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
