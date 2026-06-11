import mongoose, { Schema, models, model } from "mongoose";

export interface IRating {
  _id: mongoose.Types.ObjectId;
  professionalId: mongoose.Types.ObjectId;
  raterUserId: mongoose.Types.ObjectId;
  score: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    professionalId: { type: Schema.Types.ObjectId, ref: "Professional", required: true, index: true },
    raterUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

RatingSchema.index({ professionalId: 1, raterUserId: 1 }, { unique: true });

export const Rating = models.Rating || model<IRating>("Rating", RatingSchema);
