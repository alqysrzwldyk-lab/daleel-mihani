import { Schema, model, models } from "mongoose";

const AdSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ربط الإعلان بمحفظة المستخدم
    type: { type: String, enum: ["professional", "general"], required: true }, // نوع الإعلان: مهني أو عام
    category: { type: String, required: true }, // القسم: سيارات، عقارات، خدمات صيانة، برمجة...
    title: { type: String, required: true }, // عنوان الإعلان
    description: { type: String, required: true }, // تفاصيل ومواصفات الإعلان
    price: { type: Number, default: null }, // السعر (اختياري، للأراضي والسيارات مثلاً)
    location: { type: String, required: true }, // المدينة أو المنطقة
    images: [{ type: String }], // مصفوفة لروابط صور الإعلان
    specifications: { type: Map, of: String }, // حقول ديناميكية للمواصفات (مثل: موديل السيارة، المساحة للأرض)
    status: { type: String, enum: ["active", "sold", "archived"], default: "active" },
  },
  { timestamps: true }
);

export const Ad = models.Ad || model("Ad", AdSchema);