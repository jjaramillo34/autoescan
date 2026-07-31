export const REPORT_REASONS = [
  "precio_absurdo",
  "foto_enganosa",
  "producto_falso",
  "spam",
  "otro",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  precio_absurdo: "Precio absurdo",
  foto_enganosa: "Foto engañosa",
  producto_falso: "Producto falso / no coincide",
  spam: "Spam o duplicado",
  otro: "Otro",
};

export function getReportReasonOptions() {
  return REPORT_REASONS.map((id) => ({
    id,
    label: REPORT_REASON_LABELS[id],
  }));
}
