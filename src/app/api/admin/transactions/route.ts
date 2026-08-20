import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";

const TYPES = [
  "payment",
  "commission",
  "withdrawal",
  "deposit",
  "subscription",
  "boost",
  "refund",
  "bank_transfer",
  "remittance",
];
const STATUSES = [
  "pending",
  "completed",
  "cancelled",
  "refunded",
  "failed",
  "expired",
  "processing",
];

type TxnLean = {
  _id: string;
  fromUserId: string;
  toUserId: string;
  type: string;
  amount: number;
  fee: number;
  currency: string;
  status: string;
  refType: string | null;
  note: string;
  createdAt: Date;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const user = (searchParams.get("user") || "").trim();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1
  );
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
  );

  const filter: Record<string, unknown> = {};
  if (TYPES.includes(type)) filter.type = type;
  if (STATUSES.includes(status)) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime()))
        (filter.createdAt as Record<string, unknown>).$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, unknown>).$lte = toDate;
      }
    }
    if (!Object.keys(filter.createdAt as object).length)
      delete filter.createdAt;
  }

  let userFilterIds: string[] | null = null;
  if (user) {
    await connectDB();
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: user, $options: "i" } },
        { email: { $regex: user, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();
    userFilterIds = matchingUsers.map((u) => String(u._id));
    if (userFilterIds.length) {
      filter.$or = [
        { fromUserId: { $in: userFilterIds } },
        { toUserId: { $in: userFilterIds } },
      ];
    } else {
      return NextResponse.json({
        transactions: [],
        total: 0,
        platformRevenue: 0,
        page,
        totalPages: 1,
      });
    }
  }

  try {
    await connectDB();
    const [total, rawTxns, users] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.find({}).select("_id name email").lean(),
    ]);
    const txns = rawTxns as unknown as TxnLean[];
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const revenue = await Transaction.aggregate([
      {
        $match: {
          status: "completed",
          type: { $in: ["subscription", "boost"] },
          amount: { $gt: 0 },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return NextResponse.json({
      transactions: txns.map((t) => ({
        id: String(t._id),
        fromUserId: t.fromUserId ? String(t.fromUserId) : null,
        toUserId: t.toUserId ? String(t.toUserId) : null,
        fromName: t.fromUserId
          ? userMap.get(String(t.fromUserId))?.name || ""
          : "",
        toName: t.toUserId
          ? userMap.get(String(t.toUserId))?.name || ""
          : "",
        type: t.type,
        amount: t.amount,
        fee: t.fee,
        currency: t.currency,
        status: t.status,
        refType: t.refType || null,
        note: t.note || "",
        createdAt: t.createdAt,
      })),
      total,
      platformRevenue: revenue[0]?.total ?? 0,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin transactions error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
