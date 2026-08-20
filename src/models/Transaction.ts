import { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "payment",
        "commission",
        "withdrawal",
        "deposit",
        "subscription",
        "boost",
        "refund",
        "bank_transfer",
        "remittance",
      ],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    currency: { type: String, enum: ["YER", "SAR", "USD"], default: "YER" },
    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "cancelled",
        "refunded",
        "failed",
        "expired",
        "processing",
      ],
      default: "pending",
      index: true,
    },
    refType: { type: String, enum: ["ad", "subscription", "boost", "payment"] },
    refId: { type: Schema.Types.ObjectId },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    note: { type: String },
  },
  { timestamps: true }
);

TransactionSchema.index({ fromUserId: 1, createdAt: -1 });
TransactionSchema.index({ toUserId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ paymentId: 1 });

export const Transaction =
  models.Transaction || model("Transaction", TransactionSchema);
