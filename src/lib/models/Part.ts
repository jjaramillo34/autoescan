import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { CATEGORIAS, SECTORES_AMBATO } from "@/lib/constants";

const MODERATION = ["pending", "approved", "rejected", "reported"] as const;

const partSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    /** Marca del vehículo compatible. */
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    yearRange: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: CATEGORIAS,
      required: true,
    },
    /** Marca del fabricante del repuesto (Bosch, ACDelco…). */
    partBrand: { type: String, default: "", trim: true },
    /** Código genérico / OEM / SKU. */
    partCode: { type: String, default: "", trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: String,
      enum: SECTORES_AMBATO,
      required: true,
    },
    moderationStatus: {
      type: String,
      enum: MODERATION,
      default: "approved",
    },
    reportReason: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date },
    /** Oculto del catálogo público; sigue en inventario del vendedor. */
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

partSchema.index({
  title: "text",
  description: "text",
  brand: "text",
  model: "text",
  partBrand: "text",
  partCode: "text",
});
partSchema.index({ brand: 1, model: 1, category: 1 });
partSchema.index({ partCode: 1, partBrand: 1 });
partSchema.index({ moderationStatus: 1, isFeatured: -1 });

export type IPart = InferSchemaType<typeof partSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Part: Model<IPart> =
  (mongoose.models.Part as Model<IPart>) ||
  mongoose.model<IPart>("Part", partSchema);
