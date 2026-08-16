import mongoose, { Schema, models, model } from "mongoose";

export type UserRole = "professional" | "employer" | "admin";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  hasProfile: boolean;
  status: "active" | "disabled";
  googleId?: string;
  facebookId?: string;
  avatar?: string;
  blockedUsers?: mongoose.Types.ObjectId[]; // مستخدمون حظرتهم (تختفي إعلاناتهم عني)
  hiddenAds?: mongoose.Types.ObjectId[]; // إعلانات أخفيتها من قوائمي
  averageRating?: number; // متوسط تقييم البائع بعد التعامل
  ratingCount?: number; // عدد مرات التقييم
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ["professional", "employer", "admin"], required: true },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    hasProfile: { type: Boolean, default: false },
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },
    avatar: { type: String },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    hiddenAds: [{ type: Schema.Types.ObjectId, ref: "Ad" }],
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);