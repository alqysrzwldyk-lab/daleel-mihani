import { Schema, model, models } from "mongoose";

// نموذج المفضلة: يحفظ المستخدم إعلاناً معيناً ليصل إليه لاحقاً
const FavoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
  },
  { timestamps: true }
);

// منع التكرار: لا يمكن حفظ نفس الإعلان أكثر من مرة لنفس المستخدم
FavoriteSchema.index({ userId: 1, adId: 1 }, { unique: true });

export const Favorite = models.Favorite || model("Favorite", FavoriteSchema);
