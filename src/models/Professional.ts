import mongoose, { Schema, models, model } from "mongoose";

export interface IWorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

// مشروع من المعرض الاحترافي (Portfolio)
export interface IProject {
  title: string;
  description?: string;
  category?: string;
  image?: string;          // صورة الغلاف أو الواجهة
  images?: string[];       // صور إضافية للمشروع
  video?: string;          // رابط أو ملف فيديو
  pdf?: string;            // ملف PDF توضيحي
  beforeAfter?: { before?: string; after?: string }; // صور قبل/بعد
  completedDate?: string;  // تاريخ الإنجاز (نصي أو ISO)
}

// شهادة احترافية
export interface ICertificate {
  name: string;
  organization?: string;
  issueDate?: string;
  expiryDate?: string;
  image?: string;          // صورة الشهادة
  pdf?: string;            // ملف الشهادة PDF
}

// لغة يتحدثها المهني
export interface ILanguage {
  name: string;
  level?: string;          // مستوى الإتقان: مبتدئ / متوسط / متقدم / لغة أم
}

// مستوى مهارة (0 - 100)
export interface ISkillLevel {
  skill: string;
  level: number;
}

// أوقات العمل والجاهزية
export interface IWorkingHours {
  days?: string[];         // أيام العمل
  hours?: string;          // نص ساعات العمل
  availableToday?: boolean;
  availableNow?: boolean;
  emergencyAvailable?: boolean;
}

export interface IProfessional {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  photo?: string;
  professions: string[];
  bio?: string;
  skills: string[];
  workExperience: IWorkExperience[];
  location?: string;
  phone?: string;
  email: string;
  averageRating: number;
  ratingCount: number;
  isActive: boolean;
  verified: boolean;
  // ─── حقول الملف الاحترافي المميز ───
  cover?: string;                  // صورة الغلاف
  specialization?: string;         // التخصص الدقيق
  objective?: string;              // الهدف المهني
  education?: string;              // المؤهل العلمي
  currentWorkplace?: string;       // مكان العمل الحالي
  experienceYears?: string;        // سنوات الخبرة (نصي)
  skillLevels?: ISkillLevel[];     // مستويات المهارات
  languages?: ILanguage[];         // اللغات
  projects?: IProject[];           // المشاريع / المعرض
  certificates?: ICertificate[];   // الشهادات
  workingHours?: IWorkingHours;    // أوقات العمل
  social?: {
    whatsapp?: string;
    telegram?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  availability?: "available" | "busy" | "away"; // حالة التوفر
  createdAt: Date;
  updatedAt: Date;
}

const WorkExperienceSchema = new Schema<IWorkExperience>(
  {
    company: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    image: { type: String },
    images: [{ type: String }],
    video: { type: String },
    pdf: { type: String },
    beforeAfter: {
      before: { type: String },
      after: { type: String },
    },
    completedDate: { type: String },
  },
  { _id: false }
);

const CertificateSchema = new Schema<ICertificate>(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: String },
    issueDate: { type: String },
    expiryDate: { type: String },
    image: { type: String },
    pdf: { type: String },
  },
  { _id: false }
);

const LanguageSchema = new Schema<ILanguage>(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String },
  },
  { _id: false }
);

const SkillLevelSchema = new Schema<ISkillLevel>(
  {
    skill: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const WorkingHoursSchema = new Schema<IWorkingHours>(
  {
    days: [{ type: String }],
    hours: { type: String },
    availableToday: { type: Boolean, default: false },
    availableNow: { type: Boolean, default: false },
    emergencyAvailable: { type: Boolean, default: false },
  },
  { _id: false }
);

function professionsLimit(val: string[]) {
  return val.length <= 2;
}

const ProfessionalSchema = new Schema<IProfessional>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    photo: { type: String },
    professions: {
      type: [String],
      default: ["other"],
      validate: [professionsLimit, "يمكنك اختيار مهنتين كحد أقصى"],
      index: true,
    },
    bio: { type: String, maxlength: 1000 },
    skills: [{ type: String }],
    workExperience: [WorkExperienceSchema],
    location: { type: String },
    phone: { type: String },
    email: { type: String, required: true },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
    // ─── حقول الملف الاحترافي المميز ───
    cover: { type: String },
    specialization: { type: String, maxlength: 200 },
    objective: { type: String, maxlength: 1000 },
    education: { type: String },
    currentWorkplace: { type: String, maxlength: 200 },
    experienceYears: { type: String },
    skillLevels: [SkillLevelSchema],
    languages: [LanguageSchema],
    projects: [ProjectSchema],
    certificates: [CertificateSchema],
    workingHours: { type: WorkingHoursSchema },
    social: {
      whatsapp: { type: String },
      telegram: { type: String },
      facebook: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
      github: { type: String },
      twitter: { type: String },
      website: { type: String },
    },
    availability: { type: String, enum: ["available", "busy", "away"], default: "available" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ProfessionalSchema.virtual("profession").get(function () {
  return this.professions?.[0] || "other";
});

ProfessionalSchema.index({ name: "text", professions: "text", bio: "text", skills: "text" });

export const Professional = models.Professional || model<IProfessional>("Professional", ProfessionalSchema);
