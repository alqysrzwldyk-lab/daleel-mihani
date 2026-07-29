import { Schema, model, models } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
    paymentId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true }
);

export const Subscription = models.Subscription || model("Subscription", SubscriptionSchema);
