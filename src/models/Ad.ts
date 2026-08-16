import { Schema, model, models } from "mongoose";

const AdSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ربط الإعلان بمحفظة المستخدم
    type: { type: String, enum: ["professional", "general"], required: true }, // نوع الإعلان: مهني أو عام
    category: { type: String, required: true }, // القسم: سيارات، عقارات، خدمات صيانة، برمجة...
    title: { type: String, required: true }, // عنوان الإعلان
    description: { type: String, required: true }, // تفاصيل ومواصفات الإعلان
    price: { type: Number, default: null }, // السعر (اختياري، للأراضي والسيارات مثلاً)
    currency: { type: String, enum: ["YER", "SAR", "USD"], default: "YER" }, // العملة
    location: { type: String, required: true }, // المدينة أو المنطقة
    images: [{ type: String }], // مصفوفة لروابط صور الإعلان
    specifications: { type: Map, of: String }, // حقول ديناميكية للمواصفات (مثل: موديل السيارة، المساحة للأرض)
    status: { type: String, enum: ["active", "paused", "sold", "reserved", "expired", "coming_soon", "archived"], default: "active" }, // حالة الإعلان: متوفر، موقوف، مباع، محجوز، منتهي، قريباً، مؤرشف
    verified: { type: Boolean, default: false }, // إعلان موثق (شرارة الثقة)
    views: { type: Number, default: 0 }, // عدد المشاهدات
    contactCount: { type: Number, default: 0 }, // عدد مرات التواصل مع البائع
    sharesCount: { type: Number, default: 0 }, // عدد مرات المشاركة
    favoritesCount: { type: Number, default: 0 }, // عدد مرات الحفظ بالمفضلة
  },
  { timestamps: true }
);

export const Ad = models.Ad || model("Ad", AdSchema);