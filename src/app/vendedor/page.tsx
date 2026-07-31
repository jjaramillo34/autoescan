import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingChecklist } from "@/components/seller/onboarding-checklist";
import { SellerDashboard } from "@/components/seller/seller-dashboard";
import { contactPhone } from "@/lib/phone";
import { getSellerDashboard } from "@/lib/seller-dashboard";
import { getOnboardingStatus } from "@/lib/seller-onboarding";
import { getSellerProfile } from "@/lib/seller-profile";
import { requireSellerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel del vendedor",
  description: "WhatsApp, stock, créditos IA e impulsos de tu tienda.",
};

interface PanelPageProps {
  searchParams: Promise<{ bienvenida?: string }>;
}

export default async function VendedorPanelPage({
  searchParams,
}: PanelPageProps) {
  const session = await requireSellerSession();
  if (!session) {
    redirect("/iniciar-sesion?callbackUrl=/vendedor");
  }

  const { bienvenida } = await searchParams;
  const [data, profile] = await Promise.all([
    getSellerDashboard(session.user.id),
    getSellerProfile(session.user.id),
  ]);

  const onboarding = profile
    ? getOnboardingStatus(profile, data.productCount)
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {data.storeName}
        </p>
        <h1 className="font-heading text-3xl tracking-wide">Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultas WhatsApp, stock bajo, créditos IA y destacados.
        </p>
      </div>

      {onboarding && (
        <OnboardingChecklist
          status={onboarding}
          welcome={bienvenida === "1"}
        />
      )}

      <SellerDashboard
        data={data}
        sellerId={session.user.id}
        sellerPhone={
          profile
            ? contactPhone(profile)
            : (session.user.phone ?? "+593987654321")
        }
      />
    </div>
  );
}
