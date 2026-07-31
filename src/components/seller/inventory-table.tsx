"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Copy,
  ExternalLink,
  MoreHorizontal,
  PackageX,
  Star,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StockBadge } from "@/components/parts/stock-badge";
import { EditPartDialog } from "@/components/seller/edit-part-dialog";
import {
  archivePartAction,
  deletePartAction,
  duplicatePartAction,
  toggleFeaturedPartAction,
  updateInventoryAction,
} from "@/lib/actions/parts";
import type { PartDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InventoryTableProps {
  parts: PartDTO[];
  emptyLabel?: string;
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`, { description: value });
  } catch {
    toast.error("No se pudo copiar al portapapeles");
  }
}

export function InventoryTable({ parts, emptyLabel }: InventoryTableProps) {
  const [pending, startTransition] = useTransition();

  if (parts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-4 py-12 text-center">
        <p className="font-heading text-lg">
          {emptyLabel ? "Sin resultados" : "Sin repuestos aún"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {emptyLabel ??
            "Carga tu primer repuesto desde el formulario express."}
        </p>
      </div>
    );
  }

  function runAction(
    label: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(label);
      else toast.error(result.error ?? "No se pudo completar la acción");
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Repuesto</TableHead>
            <TableHead className="hidden md:table-cell">Marca</TableHead>
            <TableHead className="hidden sm:table-cell">Código</TableHead>
            <TableHead className="hidden lg:table-cell">Compatible</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="hidden xl:table-cell">Sector</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow
              key={part._id}
              className={cn(part.isArchived && "opacity-60")}
            >
              <TableCell>
                <div className="min-w-[140px] max-w-[220px]">
                  <p className="font-medium leading-tight">{part.title}</p>
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    {part.isFeatured && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary">
                        <Star className="size-3 fill-primary" />
                        Destacado
                      </span>
                    )}
                    {part.isArchived && (
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        Archivado
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
                    {[part.partBrand, part.partCode].filter(Boolean).join(" · ") ||
                      "Sin marca / código"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden text-sm md:table-cell">
                {part.partBrand || (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {part.partCode ? (
                  <button
                    type="button"
                    className="font-mono text-xs text-primary hover:underline"
                    onClick={() => copyText("Código", part.partCode!)}
                  >
                    {part.partCode}
                  </button>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                {part.brand} {part.model}
                <br />
                <span className="text-xs">{part.yearRange}</span>
              </TableCell>
              <TableCell className="font-semibold text-primary">
                ${part.price.toFixed(2)}
              </TableCell>
              <TableCell>
                <StockBadge quantity={part.stockQuantity} />
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                {part.location}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <EditPartDialog part={part} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Más acciones"
                        disabled={pending}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/repuesto/${part._id}`} target="_blank">
                          <ExternalLink className="size-4" />
                          Ver en catálogo
                        </Link>
                      </DropdownMenuItem>
                      {part.partCode && (
                        <DropdownMenuItem
                          onClick={() => copyText("Código", part.partCode!)}
                        >
                          <Copy className="size-4" />
                          Copiar código
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          runAction("Producto duplicado", () =>
                            duplicatePartAction(part._id),
                          )
                        }
                      >
                        <Copy className="size-4" />
                        Duplicar
                      </DropdownMenuItem>
                      {!part.isArchived && (
                        <DropdownMenuItem
                          onClick={() =>
                            runAction(
                              part.isFeatured
                                ? "Destacado quitado"
                                : "Producto destacado 30 días",
                              () =>
                                toggleFeaturedPartAction(
                                  part._id,
                                  !part.isFeatured,
                                ),
                            )
                          }
                        >
                          <Star
                            className={cn(
                              "size-4",
                              part.isFeatured && "fill-primary text-primary",
                            )}
                          />
                          {part.isFeatured ? "Quitar destacado" : "Destacar"}
                        </DropdownMenuItem>
                      )}
                      {part.stockQuantity > 0 && (
                        <DropdownMenuItem
                          onClick={() =>
                            runAction("Marcado como agotado", async () => {
                              const formData = new FormData();
                              formData.set("id", part._id);
                              formData.set("price", String(part.price));
                              formData.set("stockQuantity", "0");
                              formData.set(
                                "partBrand",
                                part.partBrand ?? "",
                              );
                              formData.set("partCode", part.partCode ?? "");
                              formData.set(
                                "description",
                                part.description ?? "",
                              );
                              formData.set(
                                "imagesJson",
                                JSON.stringify(part.images),
                              );
                              return updateInventoryAction(formData);
                            })
                          }
                          className="text-red-600 focus:text-red-600"
                        >
                          <PackageX className="size-4" />
                          Marcar agotado
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          runAction(
                            part.isArchived
                              ? "Producto restaurado"
                              : "Producto archivado",
                            () =>
                              archivePartAction(part._id, !part.isArchived),
                          )
                        }
                      >
                        {part.isArchived ? (
                          <ArchiveRestore className="size-4" />
                        ) : (
                          <Archive className="size-4" />
                        )}
                        {part.isArchived ? "Restaurar" : "Archivar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (
                            !confirm(
                              `¿Eliminar permanentemente “${part.title}”?`,
                            )
                          ) {
                            return;
                          }
                          runAction("Producto eliminado", () =>
                            deletePartAction(part._id),
                          );
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
