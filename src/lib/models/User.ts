import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { SECTORES_AMBATO, USER_ROLES } from "@/lib/constants";
import { BILLING_STATUSES, PLAN_IDS, STORE_STATUSES } from "@/lib/plans";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "vendedor",
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+593\d{9}$/, "El teléfono debe ser formato +593XXXXXXXXX"],
    },
    /** WhatsApp de contacto (si vacío se usa phone). */
    whatsappPhone: {
      type: String,
      trim: true,
      default: "",
      match: [
        /^$|^\+593\d{9}$/,
        "WhatsApp debe ser formato +593XXXXXXXXX",
      ],
    },
    city: { type: String, default: "Ambato", trim: true },
    province: { type: String, default: "Tungurahua", trim: true },
    storeName: { type: String, trim: true, required: true },
    storeLogo: { type: String, default: "", trim: true },
    storeDescription: { type: String, default: "", trim: true },
    storeSpecializations: { type: [String], default: [] },
    storeSector: {
      type: String,
      enum: [...SECTORES_AMBATO, ""],
      default: "",
    },
    businessHours: { type: String, default: "", trim: true },

    /** Monetización / super-admin */
    storeStatus: {
      type: String,
      enum: STORE_STATUSES,
      default: "pending",
    },
    planId: {
      type: String,
      enum: PLAN_IDS,
      default: "basico",
    },
    billingStatus: {
      type: String,
      enum: BILLING_STATUSES,
      default: "trial",
    },
    currentPeriodEnd: { type: Date },
    productLimit: { type: Number, default: 50 },
    aiCreditsIncluded: { type: Number, default: 100 },
    aiCreditsUsed: { type: Number, default: 0 },
    aiCreditsExtra: { type: Number, default: 0 },
    /** Mes del cupo IA (YYYY-MM). Si cambia, se reinicia `aiCreditsUsed`. */
    aiCreditsPeriodKey: { type: String, default: "" },
    featuredUntil: { type: Date },
    aiPriority: { type: Boolean, default: false },
    homeBannerUntil: { type: Date },
    stripeCustomerId: { type: String },
    payphoneSubscriptionId: { type: String },
    /** Última vez que el cron generó digest de stock bajo. */
    lastStockAlertAt: { type: Date },
    /** Digest pendiente de mostrar en el panel del vendedor. */
    stockAlertPending: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type IUserWithPassword = IUser & { passwordHash: string };

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
