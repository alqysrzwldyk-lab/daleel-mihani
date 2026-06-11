import mongoose, { Schema, models, model } from "mongoose";

export interface INotification {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId; // المستلم (User ID)
  title: string;                       // عنوان الإشعار (مثال: تم قبول ملفك!)
  message: string;                     // نص الإشعار التفصيلي
  type: "info" | "success" | "warning" | "alert"; // نوع الإشعار لشكل الأيقونة
  isRead: boolean;                     // هل قرأ المستخدم الإشعار أم لا؟
  link?: string;                       // رابط اختياري يفتح عند الضغط على الإشعار
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["info", "success", "warning", "alert"], default: "info" },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

export const Notification = models.Notification || model<INotification>("Notification", NotificationSchema);