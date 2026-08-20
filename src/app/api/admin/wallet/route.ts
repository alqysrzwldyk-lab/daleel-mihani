import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Wallet } from "@/models/Wallet";
import { Transaction } from "@/models/Transaction";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";

type TxnLean = {
  _id: unknown;
  fromUserId: unknown;
  toUserId: unknown;
  type: string;
  amount: number;
  currency?: string;
  status: string;
  note?: string;
  createdAt: Date;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const adminId = new mongoose.Types.ObjectId(auth.userId);

    let appWallet = await Wallet.findOne({ userId: adminId });
    if (!appWallet) {
      appWallet = await Wallet.create({ userId: adminId, balance: 0 });
    }

    const [
      users,
      revenueAgg,
      pendingDepositsCount,
      pendingPaymentsCount,
      recentRaw,
    ] = await Promise.all([
      User.find({}).select("_id name email").lean(),
      Transaction.aggregate([
        {
          $match: {
            status: "completed",
            toUserId: adminId,
            type: { $in: ["subscription", "boost"] },
            amount: { $gt: 0 },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.countDocuments({
        method: { $in: ["bank", "transfer"] },
        status: { $in: ["pending", "processing"] },
      }),
      Payment.countDocuments({
        method: "card",
        status: { $in: ["pending", "processing"] },
      }),
      Transaction.find({ toUserId: adminId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean() as unknown as Promise<TxnLean[]>,
    ]);

    const recent = recentRaw;
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const mapTxn = (t: TxnLean) => ({
      id: String(t._id),
      fromUserId: t.fromUserId ? String(t.fromUserId) : null,
      fromName: t.fromUserId
        ? userMap.get(String(t.fromUserId))?.name || ""
        : "",
      amount: t.amount,
      type: t.type,
      currency: t.currency || "YER",
      status: t.status,
      note: t.note || "",
      createdAt: t.createdAt,
    });

    return NextResponse.json({
      success: true,
      wallet: {
        balance: appWallet.balance,
        currency: appWallet.currency,
      },
      platformRevenue: revenueAgg[0]?.total ?? 0,
      pendingDepositsCount,
      pendingPaymentsCount,
      recentTransactions: recent.map(mapTxn),
    });
  } catch (error) {
    console.error("Admin wallet error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
