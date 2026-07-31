import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingChecklist } from "@/components/seller/onboarding-checklist";
import { StoreProfileForm } from "@/components/seller/store-profile-form";
import { getSellerDashboard } from "@/lib/seller-dashboard";
import { getOnboardingStatus } from "@/lib/seller-onboarding";
import { getSellerProfile } from "@/lib/seller-profile";
import { requireSellerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Perfil de tienda",
  description: "Configura logo, WhatsApp y especialización de tu local.",
};

export default async function SellerProfilePage() {
  const session = await requireSellerSession();
  if (!session) {
    redirect("/iniciar-sesion?callbackUrl=/vendedor/perfil");
  }

  const [profile, dashboard] = await Promise.all([
    getSellerProfile(session.user.id),
    getSellerDashboard(session.user.id),
  ]);

  if (!profile) {
    redirect("/vendedor");
  }

  const onboarding = getOnboardingStatus(profile, dashboard.productCount);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {profile.storeName || "Panel vendedor"}
        </p>
        <h1 className="font-heading text-3xl tracking-wide">
          Perfil de tienda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Logo, WhatsApp, horario y especialización visibles para compradores.
        </p>
      </div>

      {!onboarding.isComplete && (
        <OnboardingChecklist status={onboarding} />
      )}

      <StoreProfileForm profile={profile} />
    </div>
  );
}
