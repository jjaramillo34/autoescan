import { redirect } from "next/navigation";
import { requireSellerSession } from "@/lib/session";

export default async function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSellerSession();
  if (!session) {
    redirect("/iniciar-sesion?callbackUrl=/vendedor");
  }

  return <>{children}</>;
}
