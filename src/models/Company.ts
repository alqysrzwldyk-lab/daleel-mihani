import mongoose, { Schema, models, model } from "mongoose";

// نموذج الشركة: يمثل حساب الشركة المرتبط بمستخدم من نوع صاحب شركة (Employer)
// ويُربط بجدول إعلانات التوظيف (JobAdvertisements) عبر companyId
export interface ICompany {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // صاحب الحساب (User) بصيغة المرجع للعلاقة
  name: string;                    // اسم الشركة
  logo?: string;                   // شعار الشركة
  description?: string;            // نبذة عن الشركة
  industry?: string;               // القطاع أو المجال
  website?: string;                // الموقع الإلكتروني
  email?: string;                  // البريد الإلكتروني للشركة
  phone?: string;                  // رقم التواصل
  city?: string;                   // المدينة
  // ─── حقول الملف الاحترافي للشركة ───
  cover?: string;                  // صورة الغلاف الكبيرة
  tagline?: string;                // الشعار النصي المختصر للشركة
  mission?: string;                // الرسالة
  vision?: string;                 // الرؤية
  values?: string[];               // قيم الشركة
  specializations?: string[];      // التخصصات
  businessActivities?: string[];   // الأنشطة التجارية
  services?: string[];             // الخدمات الرئيسية
  foundedYear?: number;            // سنة التأسيس
  employeesCount?: number;         // عدد الموظفين
  companySize?: string;            // حجم الشركة: صغيرة / متوسطة / كبيرة
  address?: string;                // العنوان التفصيلي
  country?: string;                // الدولة
  workingHours?: string;           // ساعات العمل
  gallery?: string[];              // معرض الصور
  latitude?: number;               // خط العرض
  longitude?: number;              // خط الطول
  social?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    whatsapp?: string;
    telegram?: string;
    twitter?: string;
  };
  views: number;                   // عدد مرات مشاهدة الملف
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    logo: { type: String },
    description: { type: String, maxlength: 2000 },
    industry: { type: String },
    website: { type: String },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String },
    city: { type: String },
    // ─── حقول الملف الاحترافي للشركة ───
    cover: { type: String },
    tagline: { type: String, maxlength: 300 },
    mission: { type: String, maxlength: 2000 },
    vision: { type: String, maxlength: 2000 },
    values: [{ type: String }],
    specializations: [{ type: String }],
    businessActivities: [{ type: String }],
    services: [{ type: String }],
    foundedYear: { type: Number, min: 1500, max: new Date().getFullYear() },
    employeesCount: { type: Number, min: 1 },
    companySize: { type: String },
    address: { type: String },
    country: { type: String },
    workingHours: { type: String },
    gallery: [{ type: String }],
    latitude: { type: Number },
    longitude: { type: Number },
    social: {
      facebook: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
      whatsapp: { type: String },
      telegram: { type: String },
      twitter: { type: String },
    },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CompanySchema.index({ industry: 1 });
CompanySchema.index({ city: 1 });

export const Company = models.Company || model<ICompany>("Company", CompanySchema);
