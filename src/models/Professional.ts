import mongoose, { Schema, models, model } from "mongoose";

export interface IWorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface IProfessional {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  photo?: string;
  professions: string[]; // 🟢 تم التحديث هنا إلى مصفوفة نصوص لدعم المهن المتعددة
  bio?: string;
  skills: string[];
  workExperience: IWorkExperience[];
  location?: string;
  phone?: string;
  email: string;
  averageRating: number;
  ratingCount: number;
  isActive: boolean;
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

const ProfessionalSchema = new Schema<IProfessional>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    photo: { type: String },
    professions: { type: [String], default: [] }, // 🟢 تم التحديث هنا في قاعدة البيانات كمصفوفة وقيمة افتراضية فارغة لمنع الأخطاء
    bio: { type: String, maxlength: 1000 },
    skills: [{ type: String }],
    workExperience: [WorkExperienceSchema],
    location: { type: String },
    phone: { type: String },
    email: { type: String, required: true },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 🟢 تم التحديث هنا أيضاً ليشمل البحث النصي المهن المتعددة الجديدة بشكل صحيح
ProfessionalSchema.index({ name: "text", professions: "text", bio: "text", skills: "text" });

export const Professional = models.Professional || model<IProfessional>("Professional", ProfessionalSchema);