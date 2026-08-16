import { Schema, model, models } from "mongoose";

// سجل إحصائي يومي لكل إعلان (يُستخدم في الرسوم البيانية لاحقاً)
const AdDailyStatSchema = new Schema(
  {
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true }, // الإعلان المرتبط
    date: { type: String, required: true }, // تاريخ اليوم بصيغة YYYY-MM-DD
    views: { type: Number, default: 0 }, // المشاهدات في ذلك اليوم
    contacts: { type: Number, default: 0 }, // مرات التواصل في ذلك اليوم
    shares: { type: Number, default: 0 }, // المشاركات في ذلك اليوم
    favorites: { type: Number, default: 0 }, // مرات الحفظ/الإزالة الصافية في ذلك اليوم
  },
  { timestamps: true }
);

AdDailyStatSchema.index({ adId: 1, date: 1 }, { unique: true });

export const AdDailyStat =
  models.AdDailyStat || model("AdDailyStat", AdDailyStatSchema);
