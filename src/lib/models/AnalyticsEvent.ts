import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const EVENT_TYPES = [
  "search",
  "ai_search",
  "whatsapp_click",
  "part_view",
  "store_view",
  "favorite",
] as const;

const analyticsEventSchema = new Schema(
  {
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
    },
    query: { type: String, default: "" },
    brand: { type: String, default: "" },
    model: { type: String, default: "" },
    year: { type: String, default: "" },
    /** Sector Ambato del producto / tienda (para demanda geográfica). */
    location: { type: String, default: "" },
    partId: { type: Schema.Types.ObjectId, ref: "Part" },
    sellerId: { type: Schema.Types.ObjectId, ref: "User" },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

analyticsEventSchema.index({ type: 1, createdAt: -1 });
analyticsEventSchema.index({ sellerId: 1, type: 1, createdAt: -1 });
analyticsEventSchema.index({ location: 1, type: 1, createdAt: -1 });
analyticsEventSchema.index({ query: 1 });

export type AnalyticsEventType = (typeof EVENT_TYPES)[number];

export type IAnalyticsEvent = InferSchemaType<typeof analyticsEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AnalyticsEvent: Model<IAnalyticsEvent> =
  (mongoose.models.AnalyticsEvent as Model<IAnalyticsEvent>) ||
  mongoose.model<IAnalyticsEvent>("AnalyticsEvent", analyticsEventSchema);
