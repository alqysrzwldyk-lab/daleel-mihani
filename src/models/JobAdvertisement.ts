import mongoose, { Schema, models, model } from "mongoose";

// نموذج إعلان الوظيفة (JobAdvertisements)
// يحمل جميع حقول إعلان التوظيف ويُربط بالشركة (Company) عبر companyId
export interface IJobAdvertisement {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId; // علاقة بالشركة
  companyName: string;                // اسم الشركة (مخزن للسرعة والعرض المباشر)
  companyLogo?: string;               // شعار الشركة
  jobTitle: string;                   // المسمى الوظيفي
  jobType: string;                    // نوع الوظيفة
  department: string;                 // القسم أو التخصص
  description: string;                // وصف الوظيفة
  skills: string[];                   // المهارات المطلوبة
  education: string;                  // المؤهل العلمي
  experienceYears: string;            // سنوات الخبرة
  gender?: string;                    // الجنس (اختياري)
  ageFrom?: number;                   // العمر الأدنى (اختياري)
  ageTo?: number;                     // العمر الأقصى (اختياري)
  salary: string;                     // الراتب (نصي لدعم النطاقات مثل 800 - 1200)
  salaryMin?: number;                 // القيمة الرقمية الدنيا للراتب (للتصفية والبحث)
  salaryMax?: number;                 // القيمة الرقمية القصوى للراتب (للتصفية والبحث)
  salaryType: string;                 // نوع الراتب
  workType: string;                   // نوع الدوام: دوام كامل / جزئي / عن بعد / عقد / تدريب
  city: string;                       // المدينة
  governorate: string;                // المحافظة
  country: string;                    // الدولة
  vacancies: number;                  // عدد الوظائف المطلوبة
  deadline: string;                   // آخر موعد للتقديم (ISO)
  contactPhone: string;               // رقم التواصل
  contactEmail: string;               // البريد الإلكتروني
  website?: string;                   // الموقع الإلكتروني
  benefits: string;                   // مزايا الوظيفة
  banner?: string;                    // صورة أو Banner للإعلان
  status: "open" | "closed";          // حالة الإعلان: مفتوح / مغلق
  views: number;                      // عدد المشاهدات
  applicationsCount: number;          // عدد المتقدمين
  createdAt: Date;
  updatedAt: Date;
}

const JobAdvertisementSchema = new Schema<IJobAdvertisement>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    companyName: { type: String, required: true, trim: true },
    companyLogo: { type: String },
    jobTitle: { type: String, required: true, trim: true },
    jobType: { type: String, required: true },
    department: { type: String, required: true, index: true },
    description: { type: String, required: true },
    skills: [{ type: String }],
    education: { type: String, required: true },
    experienceYears: { type: String, required: true },
    gender: { type: String },
    ageFrom: { type: Number, min: 16, max: 80 },
    ageTo: { type: Number, min: 16, max: 80 },
    salary: { type: String, default: "" },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    salaryType: { type: String, default: "" },
    workType: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    governorate: { type: String, required: true },
    country: { type: String, required: true },
    vacancies: { type: Number, default: 1, min: 1 },
    deadline: { type: String },
    contactPhone: { type: String, required: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    website: { type: String },
    benefits: { type: String, default: "" },
    banner: { type: String },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
    views: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// فهرس مركّب لتسريع البحث والتصفية حسب الحالة والمدينة والقسم
JobAdvertisementSchema.index({ status: 1, createdAt: -1 });
JobAdvertisementSchema.index({ department: 1, city: 1, workType: 1 });

export const JobAdvertisement =
  models.JobAdvertisement || model<IJobAdvertisement>("JobAdvertisement", JobAdvertisementSchema);
