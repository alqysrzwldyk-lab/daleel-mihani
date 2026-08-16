import mongoose, { Schema, models, model } from "mongoose";

export interface IAdminAuditLog {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId; // المسؤول الذي قام بالعملية
  adminEmail: string;               // بريد المسؤول لتوضيح السجل
  action: string;                   // نوع العملية (مثل: blockUser, deleteAd, ...)
  resource: string;                 // المورد المتأثر (User, Ad, Company, ...)
  resourceId?: string;              // معرّف المورد المتأثر
  details?: Record<string, unknown>; // تفاصيل إضافية (قيمة قبل/بعد، سبب...)
  ip?: string;                      // عنوان IP للمسؤول إن توفر
  createdAt: Date;
  updatedAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    adminEmail: { type: String, required: true, trim: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String },
  },
  { timestamps: true }
);

AdminAuditLogSchema.index({ createdAt: -1 });

export const AdminAuditLog =
  models.AdminAuditLog || model<IAdminAuditLog>("AdminAuditLog", AdminAuditLogSchema);
