import { Schema, model, models } from "mongoose";

const AdBoostSchema = new Schema(
  {
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
    paymentId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true }
);

export const AdBoost = models.AdBoost || model("AdBoost", AdBoostSchema);
