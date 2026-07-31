import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const aiUsageSchema = new Schema(
  {
    dateKey: { type: String, required: true }, // YYYY-MM-DD
    monthKey: { type: String, required: true }, // YYYY-MM
    ipHash: { type: String, default: "unknown" },
    sessionId: { type: String, default: "" },
    model: { type: String, default: "gemini-2.5-flash" },
    costUsd: { type: Number, default: 0 },
    success: { type: Boolean, default: true },
    pieza: { type: String, default: "" },
    categoria: { type: String, default: "" },
    brandFilter: { type: String, default: "" },
  },
  { timestamps: true },
);

aiUsageSchema.index({ dateKey: 1 });
aiUsageSchema.index({ monthKey: 1 });
aiUsageSchema.index({ ipHash: 1, createdAt: -1 });

export type IAiUsage = InferSchemaType<typeof aiUsageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AiUsage: Model<IAiUsage> =
  (mongoose.models.AiUsage as Model<IAiUsage>) ||
  mongoose.model<IAiUsage>("AiUsage", aiUsageSchema);
