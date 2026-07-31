import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  DEFAULT_AI_COST_ALERT_PERCENT,
  DEFAULT_GEMINI_COST_PER_REQUEST,
  DEFAULT_GEMINI_MONTHLY_BUDGET_USD,
} from "@/lib/plans";

const platformSettingsSchema = new Schema(
  {
    key: { type: String, unique: true, default: "default" },
    geminiCostPerRequest: {
      type: Number,
      default: DEFAULT_GEMINI_COST_PER_REQUEST,
    },
    aiCostAlertPercent: {
      type: Number,
      default: DEFAULT_AI_COST_ALERT_PERCENT,
    },
    /** Tope USD de gasto Gemini por mes (plataforma). */
    geminiMonthlyBudgetUsd: {
      type: Number,
      default: DEFAULT_GEMINI_MONTHLY_BUDGET_USD,
    },
    /** Si true, bloquea búsquedas por foto al llegar al presupuesto. */
    geminiBudgetHardStop: { type: Boolean, default: true },
    aiRateLimitPerIpHour: { type: Number, default: 30 },
    aiRateLimitPerSessionDay: { type: Number, default: 40 },
    billingProvider: {
      type: String,
      enum: ["stripe", "payphone", "paymentez", "manual"],
      default: "manual",
    },
    homeBannerText: { type: String, default: "" },
    homeBannerSellerId: { type: String, default: "" },
    homeBannerUntil: { type: Date },
  },
  { timestamps: true },
);

export type IPlatformSettings = InferSchemaType<typeof platformSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PlatformSettings: Model<IPlatformSettings> =
  (mongoose.models.PlatformSettings as Model<IPlatformSettings>) ||
  mongoose.model<IPlatformSettings>("PlatformSettings", platformSettingsSchema);
