import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingChecklist } from "@/components/seller/onboarding-checklist";
import { SellerDashboard } from "@/components/seller/seller-dashboard";
import { StockAlertBanner } from "@/components/seller/stock-alert-banner";
import { StoreStatusBanner } from "@/components/seller/store-status-banner";
import { contactPhone } from "@/lib/phone";
import { getSellerParts } from "@/lib/parts-service";
import { getSellerDashboard } from "@/lib/seller-dashboard";
import { getOnboardingStatus } from "@/lib/seller-onboarding";
import { getSellerProfile } from "@/lib/seller-profile";
import { requireSellerSession } from "@/lib/session";
import { getSellerStockAlertBanner } from "@/lib/stock-alerts";

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
  const [data, profile, stockAlert, parts] = await Promise.all([
    getSellerDashboard(session.user.id),
    getSellerProfile(session.user.id),
    getSellerStockAlertBanner(session.user.id),
    getSellerParts(session.user.id),
  ]);

  const onboarding = profile
    ? getOnboardingStatus(profile, data.productCount, parts)
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {data.storeName}
        </p>
        <h1 className="font-heading text-3xl tracking-wide">Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vistas, conversión a WhatsApp, stock, créditos IA y destacados.
        </p>
      </div>

      {profile && <StoreStatusBanner storeStatus={profile.storeStatus} />}

      {onboarding && (
        <OnboardingChecklist
          status={onboarding}
          welcome={bienvenida === "1"}
        />
      )}

      {stockAlert?.pending && stockAlert.digest && (
        <StockAlertBanner digest={stockAlert.digest} />
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
