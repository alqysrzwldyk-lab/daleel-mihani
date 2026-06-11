import mongoose, { Schema, models, model } from "mongoose";

export type UserRole = "professional" | "employer";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  hasProfile: boolean; // الحقل الجديد المضاف في الـ Interface
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["professional", "employer"], required: true },
    // الحقل الجديد المضاف في قاعدة البيانات مع قيمة افتراضية false
    hasProfile: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);