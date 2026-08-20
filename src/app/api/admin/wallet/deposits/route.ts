import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";

type PaymentLean = {
  _id: unknown;
  userId: unknown;
  amount: number;
  currency: string;
  method: string;
  status: string;
  metadata: Record<string, unknown>;
  note?: string;
  createdAt: Date;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "pending";
  const method = searchParams.get("method") || "";
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1
  );
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
  );

  try {
    await connectDB();

    const filter: Record<string, unknown> = {
      status: { $in: ["pending", "processing"] },
      method: { $in: ["bank", "transfer"] },
    };

    if (status === "completed") {
      filter.status = "completed";
    } else if (status === "failed") {
      filter.status = { $in: ["failed", "cancelled"] };
    }

    if (method && ["bank", "transfer"].includes(method)) {
      filter.method = method;
    }

    const [total, payments, users] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.find({}).select("_id name email").lean(),
    ]);

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const typed = payments as unknown as PaymentLean[];

    return NextResponse.json({
      deposits: typed.map((p) => ({
        id: String(p._id),
        userId: String(p.userId),
        userName: userMap.get(String(p.userId))?.name || "",
        userEmail: userMap.get(String(p.userId))?.email || "",
        amount: p.amount,
        currency: p.currency,
        method: p.method,
        status: p.status,
        metadata: p.metadata,
        note: p.note || "",
        createdAt: p.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin deposits error:", error);
    return NextResponse.json(
      { error: "generic" },
      { status: 500 }
    );
  }
}
