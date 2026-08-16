import { Schema, model, models } from "mongoose";

// نموذج الإبلاغ عن مستخدم (بائع): بلاغ مباشر ضد مستخدم
const UserReportSchema = new Schema(
  {
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reporterUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    note: { type: String },
    status: { type: String, enum: ["pending", "reviewed", "removed"], default: "pending" },
  },
  { timestamps: true }
);

export const UserReport = models.UserReport || model("UserReport", UserReportSchema);
