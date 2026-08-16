import { Schema, model, models } from "mongoose";

// نموذج الإبلاغ عن إعلان: يسجل بلاغات المستخدمين ضد إعلان/بائع معين
const AdReportSchema = new Schema(
  {
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
    reporterUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    note: { type: String },
    status: { type: String, enum: ["pending", "reviewed", "removed"], default: "pending" },
  },
  { timestamps: true }
);

export const AdReport = models.AdReport || model("AdReport", AdReportSchema);
