"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  Heart,
  LayoutDashboard,
  Menu,
  Package,
  PanelLeft,
  PlusCircle,
  Store,
  UserRound,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Catálogo", icon: Package },
  { href: "/buscar-por-imagen", label: "Buscar por foto", icon: Camera },
  { href: "/tiendas", label: "Tiendas", icon: Store },
  { href: "/guardados", label: "Guardados", icon: Heart },
];

const sellerLinks = [
  { href: "/vendedor", label: "Panel", icon: PanelLeft },
  { href: "/vendedor/inventario", label: "Mi inventario", icon: Wrench },
  {
    href: "/vendedor/nuevo-repuesto",
    label: "Cargar repuesto",
    icon: PlusCircle,
  },
  { href: "/vendedor/impulsos", label: "Impulsos", icon: Zap },
  { href: "/vendedor/perfil", label: "Mi tienda", icon: UserRound },
];

const adminLinks = [
  { href: "/admin", label: "Panel admin", icon: LayoutDashboard },
];

interface SiteHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    storeName?: string;
    role?: "comprador" | "vendedor" | "admin";
  } | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const links = !user
    ? publicLinks
    : user.role === "admin"
      ? [...publicLinks, ...adminLinks]
      : [...publicLinks, ...sellerLinks];

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wrench className="size-4" />
          </span>
          <span className="font-heading text-xl tracking-wider uppercase">
            Auto<span className="text-primary">Escán</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground lg:inline">
            Piloto · Ambato
          </span>
          <ThemeToggle />
          <UserMenu user={user} />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-heading tracking-wide">
                  AutoEscán
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 px-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-secondary"
                    >
                      <Icon className="size-4 text-primary" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
