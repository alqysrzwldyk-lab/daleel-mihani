import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Subscription } from "@/models/Subscription";
import { User } from "@/models/User";

const STATUSES = ["active", "expired", "cancelled"];
const PLANS = ["free", "premium"];

type SubLean = {
  _id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "";
  const plan = searchParams.get("plan") || "";
  const user = (searchParams.get("user") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  const filter: Record<string, unknown> = {};
  if (STATUSES.includes(status)) filter.status = status;
  if (PLANS.includes(plan)) filter.plan = plan;

  let userFilterIds: string[] | null = null;
  if (user) {
    await connectDB();
    const matchingUsers = await User.find({
      $or: [{ name: { $regex: user, $options: "i" } }, { email: { $regex: user, $options: "i" } }],
    })
      .select("_id")
      .lean();
    userFilterIds = matchingUsers.map((u) => String(u._id));
    if (userFilterIds.length) {
      filter.userId = { $in: userFilterIds };
    } else {
      return NextResponse.json({ subscriptions: [], total: 0, page, totalPages: 1 });
    }
  }

  try {
    await connectDB();
    const [total, rawSubs, users] = await Promise.all([
      Subscription.countDocuments(filter),
      Subscription.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.find({}).select("_id name email").lean(),
    ]);
    const subs = rawSubs as unknown as SubLean[];
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    return NextResponse.json({
      subscriptions: subs.map((s) => ({
        id: String(s._id),
        userId: String(s.userId),
        userName: userMap.get(String(s.userId))?.name || "",
        userEmail: userMap.get(String(s.userId))?.email || "",
        plan: s.plan,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        createdAt: s.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
