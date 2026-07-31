import { contactPhone, isValidEcuadorMobile } from "@/lib/phone";
import type { PartDTO, SellerInfo } from "@/lib/types";

export type OnboardingStepId =
  | "whatsapp"
  | "logo"
  | "description"
  | "specializations"
  | "sector"
  | "hours"
  | "first_product"
  | "catalog_ready";

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  detail: string;
  href: string;
  done: boolean;
}

export interface OnboardingStatus {
  steps: OnboardingStep[];
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
  nextStep: OnboardingStep | null;
}

export function getOnboardingStatus(
  profile: SellerInfo,
  productCount: number,
  parts: PartDTO[] = [],
): OnboardingStatus {
  const hasWhatsApp = isValidEcuadorMobile(contactPhone(profile));
  const catalogReady = parts.some(
    (p) =>
      !p.isArchived &&
      p.moderationStatus !== "rejected" &&
      (p.images?.length ?? 0) > 0 &&
      p.price > 0 &&
      p.stockQuantity > 0,
  );

  const steps: OnboardingStep[] = [
    {
      id: "whatsapp",
      title: "Confirma tu WhatsApp de contacto",
      detail: "Es el canal por el que te escriben los compradores.",
      href: "/vendedor/perfil#whatsapp",
      done: hasWhatsApp,
    },
    {
      id: "logo",
      title: "Sube el logo de tu tienda",
      detail: "Aparece en el directorio y en tu ficha pública.",
      href: "/vendedor/perfil#logo",
      done: Boolean(profile.storeLogo?.trim()),
    },
    {
      id: "description",
      title: "Escribe una descripción",
      detail: "Cuéntale a los compradores en qué se especializa tu local.",
      href: "/vendedor/perfil#descripcion",
      done: Boolean(profile.storeDescription?.trim()),
    },
    {
      id: "specializations",
      title: "Elige tu especialización",
      detail: "Frenos, sensores, japoneses… ayuda a encontrarte más fácil.",
      href: "/vendedor/perfil#especializacion",
      done: (profile.storeSpecializations?.length ?? 0) > 0,
    },
    {
      id: "sector",
      title: "Indica tu sector en Ambato",
      detail: "Los compradores filtran por zona.",
      href: "/vendedor/perfil#sector",
      done: Boolean(profile.storeSector?.trim()),
    },
    {
      id: "hours",
      title: "Agrega tu horario",
      detail: "Ej. Lun–Sáb 8:30–18:30.",
      href: "/vendedor/perfil#horario",
      done: Boolean(profile.businessHours?.trim()),
    },
    {
      id: "first_product",
      title: "Publica tu primer repuesto",
      detail: "Con código, fotos y precio para empezar a recibir WhatsApp.",
      href: "/vendedor/nuevo-repuesto",
      done: productCount > 0,
    },
    {
      id: "catalog_ready",
      title: "Deja un producto listo para vender",
      detail: "Al menos uno con foto, precio y stock mayor a 0.",
      href: "/vendedor/inventario",
      done: catalogReady,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = Math.round((completed / total) * 100);
  const nextStep = steps.find((s) => !s.done) ?? null;

  return {
    steps,
    completed,
    total,
    percent,
    isComplete: completed === total,
    nextStep,
  };
}
