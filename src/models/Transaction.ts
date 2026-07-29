import { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["payment", "commission", "withdrawal", "deposit", "subscription", "boost"],
      required: true,
    },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    currency: { type: String, enum: ["YER", "SAR", "USD"], default: "YER" },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded"],
      default: "pending",
    },
    refType: { type: String, enum: ["ad", "subscription", "boost"] },
    refId: { type: Schema.Types.ObjectId },
    note: { type: String },
  },
  { timestamps: true }
);

export const Transaction = models.Transaction || model("Transaction", TransactionSchema);
