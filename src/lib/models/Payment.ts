import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const paymentSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountUsd: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    type: {
      type: String,
      enum: ["subscription", "ai_credits", "upsell_destacado", "upsell_ai", "upsell_banner"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    provider: {
      type: String,
      enum: ["stripe", "payphone", "paymentez", "manual"],
      default: "manual",
    },
    providerRef: { type: String, default: "" },
    description: { type: String, default: "" },
    invoiceUrl: { type: String, default: "" },
    paidAt: { type: Date },
    /** p.ej. { planId: "pro" } o { upsellKey: "destacado" } */
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

paymentSchema.index({ seller: 1, createdAt: -1 });

export type IPayment = InferSchemaType<typeof paymentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Payment: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment>) ||
  mongoose.model<IPayment>("Payment", paymentSchema);
