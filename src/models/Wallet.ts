import { Schema, model, models } from "mongoose";

const WalletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    currency: {
      type: String,
      enum: ["YER", "SAR", "USD"],
      default: "YER",
    },
  },
  { timestamps: true }
);

export const Wallet = models.Wallet || model("Wallet", WalletSchema);
