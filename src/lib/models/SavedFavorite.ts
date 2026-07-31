import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const savedFavoriteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    partIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Part" }],
      default: [],
    },
  },
  { timestamps: true },
);

export type ISavedFavorite = InferSchemaType<typeof savedFavoriteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SavedFavorite: Model<ISavedFavorite> =
  (mongoose.models.SavedFavorite as Model<ISavedFavorite>) ||
  mongoose.model<ISavedFavorite>("SavedFavorite", savedFavoriteSchema);
