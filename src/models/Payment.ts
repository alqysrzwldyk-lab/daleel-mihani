import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      enum: ["YER", "SAR", "USD"],
      default: "YER",
    },
    method: {
      type: String,
      enum: ["card", "bank", "transfer"],
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["gateway", "manual"],
      default: "manual",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
        "expired",
      ],
      default: "pending",
      index: true,
    },
    providerReference: {
      type: String,
      sparse: true,
      unique: true,
    },
    providerOrderId: {
      type: String,
      sparse: true,
      unique: true,
    },
    providerTransactionId: {
      type: String,
      sparse: true,
      unique: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    completedAt: { type: Date },
    failedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String },
    note: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ provider: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment = models.Payment || model("Payment", PaymentSchema);
