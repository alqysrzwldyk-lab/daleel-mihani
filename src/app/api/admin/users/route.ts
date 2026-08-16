import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Ad } from "@/models/Ad";

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  const filter: Record<string, unknown> = {};
  if (role === "professional" || role === "employer" || role === "admin") filter.role = role;
  if (status === "active" || status === "disabled") filter.status = status;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) (filter.createdAt as Record<string, unknown>).$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, unknown>).$lte = toDate;
      }
    }
    if (!Object.keys(filter.createdAt as object).length) delete filter.createdAt;
  }

  try {
    await connectDB();
    const [total, users, adCounts] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-password")
        .lean(),
      Ad.aggregate([{ $group: { _id: "$userId", count: { $sum: 1 } } }]),
    ]);
    const adMap = new Map(adCounts.map((a) => [String(a._id), a.count]));

    return NextResponse.json({
      users: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        hasProfile: u.hasProfile,
        adsCount: adMap.get(String(u._id)) ?? 0,
        createdAt: u.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
