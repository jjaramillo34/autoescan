import type { Metadata } from "next";
import { getModerationQueue } from "@/lib/admin/metrics";
import {
  moderatePartAction,
  togglePartFeaturedAction,
} from "@/lib/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moderación" };

export default async function AdminModeracionPage() {
  const items = await getModerationQueue();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl tracking-wide">Moderación</h2>
        <p className="text-sm text-muted-foreground">
          Publicaciones nuevas, reportes y destacados. Revisa calidad de
          foto/SEO básico.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repuesto</TableHead>
              <TableHead>Tienda</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Calidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No hay ítems pendientes.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => {
              const qualityIssues: string[] = [];
              if (item.images < 1) qualityIssues.push("Sin foto");
              if (item.price > 500) qualityIssues.push("Precio alto");
              if (item.title.length < 8) qualityIssues.push("Título corto");

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.brand} {item.model}
                    </p>
                    {item.isFeatured && (
                      <Badge className="mt-1" variant="default">
                        Destacado
                      </Badge>
                    )}
                    {item.reportReason && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                        {item.reportReason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{item.storeName}</TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">
                    {qualityIssues.length ? qualityIssues.join(" · ") : "OK"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.moderationStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <form action={moderatePartAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="approved" />
                        <Button size="sm" type="submit">
                          Aprobar
                        </Button>
                      </form>
                      <form action={moderatePartAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <Button size="sm" variant="outline" type="submit">
                          Rechazar
                        </Button>
                      </form>
                      <form action={togglePartFeaturedAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          type="hidden"
                          name="featured"
                          value={item.isFeatured ? "false" : "true"}
                        />
                        <Button size="sm" variant="secondary" type="submit">
                          {item.isFeatured ? "Quitar destacado" : "Destacar"}
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
