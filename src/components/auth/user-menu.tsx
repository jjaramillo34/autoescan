"use client";

import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    storeName?: string;
    role?: "comprador" | "vendedor" | "admin";
  } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  if (!user) {
    return (
      <Button asChild variant="secondary" size="sm" className="gap-1.5">
        <Link href="/iniciar-sesion">
          <LogIn className="size-3.5" />
          <span className="hidden sm:inline">Ingresar</span>
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 max-w-[160px]">
          <UserRound className="size-3.5 shrink-0" />
          <span className="truncate">
            {user.role === "admin"
              ? "Super-admin"
              : user.storeName || user.name || "Cuenta"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">
            {user.storeName || user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "admin" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">Panel super-admin</Link>
          </DropdownMenuItem>
        ) : user.role === "comprador" ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/guardados">Mis favoritos</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/">Catálogo</Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/vendedor">Panel</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/vendedor/inventario">Mi inventario</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/vendedor/nuevo-repuesto">Cargar repuestos</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/vendedor/impulsos">Planes e impulsos</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/vendedor/perfil">Perfil de tienda</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void logoutAction();
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
