import mongoose, { Schema, models, model } from "mongoose";

// نموذج تقييم الشركة (CompanyRatings)
// يسمح للمستخدمين بتقييم الشركات وكتابة تقييم نصي مصاحب للنجوم
export interface ICompanyRating {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;  // علاقة بالشركة
  reviewerId: mongoose.Types.ObjectId; // صاحب التقييم (User)
  rating: number;                      // التقييم من 1 إلى 5
  comment?: string;                    // تعليق نصي اختياري
  createdAt: Date;
  updatedAt: Date;
}

const CompanyRatingSchema = new Schema<ICompanyRating>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

// منع التكرار: لا يمكن لنفس المستخدم تقييم نفس الشركة أكثر من مرة
CompanyRatingSchema.index({ companyId: 1, reviewerId: 1 }, { unique: true });

export const CompanyRating =
  models.CompanyRating || model<ICompanyRating>("CompanyRating", CompanyRatingSchema);
