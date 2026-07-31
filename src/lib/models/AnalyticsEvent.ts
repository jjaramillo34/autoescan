import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const analyticsEventSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["search", "ai_search", "whatsapp_click"],
      required: true,
    },
    query: { type: String, default: "" },
    brand: { type: String, default: "" },
    model: { type: String, default: "" },
    year: { type: String, default: "" },
    partId: { type: Schema.Types.ObjectId, ref: "Part" },
    sellerId: { type: Schema.Types.ObjectId, ref: "User" },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

analyticsEventSchema.index({ type: 1, createdAt: -1 });
analyticsEventSchema.index({ sellerId: 1, type: 1, createdAt: -1 });
analyticsEventSchema.index({ query: 1 });

export type IAnalyticsEvent = InferSchemaType<typeof analyticsEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AnalyticsEvent: Model<IAnalyticsEvent> =
  (mongoose.models.AnalyticsEvent as Model<IAnalyticsEvent>) ||
  mongoose.model<IAnalyticsEvent>("AnalyticsEvent", analyticsEventSchema);
