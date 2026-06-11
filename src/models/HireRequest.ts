import mongoose, { Schema, models, model } from "mongoose";

export interface IHireRequest {
  _id: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;   // صاحب الشركة الذي أرسل الطلب
  professionalId: mongoose.Types.ObjectId; // المهني المستهدف بالطلب
  companyName: string;                     // اسم الشركة
  title: string;                           // عنوان الوظيفة أو المشروع
  message: string;                         // تفاصيل الطلب أو العرض
  status: "pending" | "accepted" | "rejected"; // حالة الطلب
  createdAt: Date;
  updatedAt: Date;
}

const HireRequestSchema = new Schema<IHireRequest>(
  {
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    professionalId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const HireRequest = models.HireRequest || model<IHireRequest>("HireRequest", HireRequestSchema);