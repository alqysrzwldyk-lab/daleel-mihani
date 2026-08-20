import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Wallet } from "@/models/Wallet";
import { Transaction } from "@/models/Transaction";

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient balance");
    this.name = "InsufficientBalanceError";
  }
}

export async function creditWallet(
  userId: string,
  amount: number,
  transactionData: {
    fromUserId?: string;
    toUserId?: string;
    type: string;
    fee?: number;
    currency?: string;
    status?: string;
    refType?: string;
    refId?: string;
    paymentId?: string;
    note?: string;
  }
): Promise<{ balance: number; transaction: unknown }> {
  await connectDB();

  const oid = new mongoose.Types.ObjectId(userId);

  let wallet = await Wallet.findOneAndUpdate(
    { userId: oid },
    { $inc: { balance: amount } },
    { new: true }
  );

  if (!wallet) {
    try {
      wallet = await Wallet.create({ userId: oid, balance: amount });
    } catch {
      // Unique index conflict: another request created the wallet. Retry.
      wallet = await Wallet.findOneAndUpdate(
        { userId: oid },
        { $inc: { balance: amount } },
        { new: true }
      );
    }
  }

  if (!wallet) {
    throw new Error("Failed to create or find wallet for user " + userId);
  }

  const transaction = await Transaction.create({
    ...transactionData,
    fromUserId: transactionData.fromUserId
      ? new mongoose.Types.ObjectId(transactionData.fromUserId)
      : undefined,
    toUserId: transactionData.toUserId
      ? new mongoose.Types.ObjectId(transactionData.toUserId)
      : undefined,
    paymentId: transactionData.paymentId
      ? new mongoose.Types.ObjectId(transactionData.paymentId)
      : undefined,
    amount,
    currency: transactionData.currency || wallet.currency,
    status: transactionData.status || "completed",
  });

  return { balance: wallet.balance, transaction };
}

export async function debitWallet(
  userId: string,
  amount: number,
  transactionData: {
    fromUserId?: string;
    toUserId?: string;
    type: string;
    fee?: number;
    currency?: string;
    status?: string;
    refType?: string;
    refId?: string;
    paymentId?: string;
    note?: string;
  }
): Promise<{ balance: number; transaction: unknown }> {
  await connectDB();

  const wallet = await Wallet.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(userId),
      balance: { $gte: amount },
    },
    { $inc: { balance: -amount } },
    { new: true }
  );

  if (!wallet) {
    throw new InsufficientBalanceError();
  }

  const transaction = await Transaction.create({
    ...transactionData,
    fromUserId: transactionData.fromUserId
      ? new mongoose.Types.ObjectId(transactionData.fromUserId)
      : undefined,
    toUserId: transactionData.toUserId
      ? new mongoose.Types.ObjectId(transactionData.toUserId)
      : undefined,
    paymentId: transactionData.paymentId
      ? new mongoose.Types.ObjectId(transactionData.paymentId)
      : undefined,
    amount,
    currency: transactionData.currency || wallet.currency,
    status: transactionData.status || "completed",
  });

  return { balance: wallet.balance, transaction };
}

export async function atomicTransfer(
  fromUserId: string,
  toUserId: string,
  amount: number,
  debitData: {
    type: string;
    fee?: number;
    currency?: string;
    refType?: string;
    refId?: string;
    paymentId?: string;
    note?: string;
  }
): Promise<{ debitBalance: number; creditBalance: number; debitTxn: unknown; creditTxn: unknown }> {
  await connectDB();
  const session = await mongoose.startSession();

  try {
    const results = await session.withTransaction(async () => {
      const debitWallet_ = await Wallet.findOneAndUpdate(
        {
          userId: new mongoose.Types.ObjectId(fromUserId),
          balance: { $gte: amount },
        },
        { $inc: { balance: -amount } },
        { new: true, session }
      );

      if (!debitWallet_) {
        throw new InsufficientBalanceError();
      }

      let creditWallet_ = await Wallet.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(toUserId) },
        { $inc: { balance: amount } },
        { new: true, session }
      );

      let creditBalance: number;

      if (!creditWallet_) {
        const newWallet = await Wallet.create(
          [
            {
              userId: new mongoose.Types.ObjectId(toUserId),
              balance: amount,
            },
          ],
          { session }
        );
        creditBalance = newWallet[0].balance;
      } else {
        creditBalance = creditWallet_.balance;
      }

      const debitTxn = await Transaction.create(
        [
          {
            fromUserId: new mongoose.Types.ObjectId(fromUserId),
            toUserId: new mongoose.Types.ObjectId(toUserId),
            type: debitData.type,
            amount,
            fee: debitData.fee || 0,
            currency: debitData.currency || debitWallet_.currency,
            status: "completed",
            refType: debitData.refType,
            refId: debitData.refId
              ? new mongoose.Types.ObjectId(debitData.refId)
              : undefined,
            paymentId: debitData.paymentId
              ? new mongoose.Types.ObjectId(debitData.paymentId)
              : undefined,
            note: debitData.note,
          },
        ],
        { session }
      );

      const creditTxn = await Transaction.create(
        [
          {
            fromUserId: new mongoose.Types.ObjectId(fromUserId),
            toUserId: new mongoose.Types.ObjectId(toUserId),
            type: debitData.type,
            amount,
            fee: 0,
            currency: debitData.currency || debitWallet_.currency,
            status: "completed",
            refType: debitData.refType,
            refId: debitData.refId
              ? new mongoose.Types.ObjectId(debitData.refId)
              : undefined,
            paymentId: debitData.paymentId
              ? new mongoose.Types.ObjectId(debitData.paymentId)
              : undefined,
            note: debitData.note,
          },
        ],
        { session }
      );

      return {
        debitBalance: debitWallet_.balance,
        creditBalance,
        debitTxn: debitTxn[0],
        creditTxn: creditTxn[0],
      };
    });

    return {
      debitBalance: results.debitBalance,
      creditBalance: results.creditBalance,
      debitTxn: results.debitTxn,
      creditTxn: results.creditTxn,
    };
  } finally {
    await session.endSession();
  }
}

export async function getWalletBalance(userId: string): Promise<number> {
  await connectDB();
  const wallet = await Wallet.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  }).lean<{ balance: number } | null>();
  return wallet?.balance ?? 0;
}
