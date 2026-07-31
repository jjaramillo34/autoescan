import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/iniciar-sesion?callbackUrl=/admin");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Super-admin
        </p>
        <h1 className="font-heading text-3xl tracking-wide">
          Panel AutoEscán
        </h1>
        <p className="text-sm text-muted-foreground">
          Monetización, IA, vendedores y marketplace — Ambato
        </p>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
