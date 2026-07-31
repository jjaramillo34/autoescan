import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ImpulsosPanel } from "@/components/seller/impulsos-panel";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { PLANS, type PlanId } from "@/lib/plans";
import { getSellerPayments } from "@/lib/seller-billing";
import { requireSellerSession } from "@/lib/session";
import { DEMO_SELLER_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planes e impulsos",
  description: "Mejora tu plan o impulsa productos en AutoEscán.",
};

export default async function SellerImpulsosPage() {
  const session = await requireSellerSession();
  if (!session) {
    redirect("/iniciar-sesion?callbackUrl=/vendedor/impulsos");
  }

  let planId: PlanId = "basico";
  if (!isDatabaseConfigured()) {
    planId = session.user.id === DEMO_SELLER_ID ? "pro" : "basico";
  } else {
    await connectDB();
    const user = await User.findById(session.user.id).select("planId").lean();
    planId = (user?.planId as PlanId) || "basico";
  }

  const payments = await getSellerPayments(session.user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Plan {PLANS[planId].name}
        </p>
        <h1 className="font-heading text-3xl tracking-wide">
          Planes e impulsos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solicita un plan o un impulso. Coordinamos el pago por WhatsApp hasta
          activar cobro automático.
        </p>
      </div>

      <ImpulsosPanel currentPlanId={planId} payments={payments} />
    </div>
  );
}
