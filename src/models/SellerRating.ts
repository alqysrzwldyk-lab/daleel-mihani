import mongoose, { Schema, models, model } from "mongoose";

export interface ISellerRating {
  _id: mongoose.Types.ObjectId;
  sellerUserId: mongoose.Types.ObjectId;
  raterUserId: mongoose.Types.ObjectId;
  adId: mongoose.Types.ObjectId;
  score: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SellerRatingSchema = new Schema<ISellerRating>(
  {
    sellerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    raterUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// مستخدم واحد لا يقيّم نفس البائع أكثر من مرة
SellerRatingSchema.index({ sellerUserId: 1, raterUserId: 1 }, { unique: true });

export const SellerRating = models.SellerRating || model<ISellerRating>("SellerRating", SellerRatingSchema);
