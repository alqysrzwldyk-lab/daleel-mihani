import mongoose, { Schema, models, model } from "mongoose";

// نموذج طلب التقديم على وظيفة (JobApplications)
// يُربط بالوظيفة (JobAdvertisement) عبر jobId وبالشركة عبر companyId وبالمهني عبر professionalId
export interface IJobApplication {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;      // علاقة بإعلان الوظيفة
  companyId: mongoose.Types.ObjectId;  // علاقة بالشركة
  professionalId: mongoose.Types.ObjectId; // صاحب الطلب (User من نوع مهني)
  fullName: string;                    // الاسم
  phone: string;                       // رقم الهاتف
  email: string;                       // البريد الإلكتروني
  profession: string;                  // المهنة
  education: string;                   // المؤهل العلمي
  experience: string;                  // سنوات الخبرة
  coverLetter: string;                 // رسالة تعريفية
  cvFile: string;                      // رابط ملف السيرة الذاتية PDF
  photo?: string;                      // صورة شخصية (اختياري)
  status: "pending" | "accepted" | "rejected"; // حالة الطلب
  companyNote?: string;                // رسالة من الشركة للمتقدم
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "JobAdvertisement", required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    professionalId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    profession: { type: String, required: true, trim: true },
    education: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    coverLetter: { type: String, required: true },
    cvFile: { type: String, required: true },
    photo: { type: String },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true },
    companyNote: { type: String },
  },
  { timestamps: true }
);

// منع التكرار: لا يمكن للمهني نفسه التقديم على نفس الوظيفة أكثر من مرة
JobApplicationSchema.index({ jobId: 1, professionalId: 1 }, { unique: true });

export const JobApplication =
  models.JobApplication || model<IJobApplication>("JobApplication", JobApplicationSchema);
