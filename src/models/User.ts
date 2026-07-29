import mongoose, { Schema, models, model } from "mongoose";

export type UserRole = "professional" | "employer";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  hasProfile: boolean;
  googleId?: string;
  facebookId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ["professional", "employer"], required: true },
    hasProfile: { type: Boolean, default: false },
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },
    avatar: { type: String },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);