import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Ad } from "@/models/Ad";
import { User } from "@/models/User";

const AD_STATUSES = ["active", "paused", "sold", "reserved", "expired", "coming_soon", "archived"];

type AdLean = {
  _id: string;
  userId: string;
  title: string;
  category: string;
  type: string;
  location: string;
  price: number | null;
  currency: string;
  status: string;
  verified: boolean;
  views: number;
  createdAt: Date;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";
  const owner = (searchParams.get("owner") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  const filter: Record<string, unknown> = {};
  if (AD_STATUSES.includes(status)) filter.status = status;
  if (category) filter.category = { $regex: category, $options: "i" };
  if (owner) filter.userId = owner;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];
  }

  try {
    await connectDB();
    const [total, rawAds, users] = await Promise.all([
      Ad.countDocuments(filter),
      Ad.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.find({}).select("_id name email").lean(),
    ]);
    const ads = rawAds as unknown as AdLean[];
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    return NextResponse.json({
      ads: ads.map((a) => ({
        id: String(a._id),
        userId: String(a.userId),
        ownerName: userMap.get(String(a.userId))?.name || "",
        ownerEmail: userMap.get(String(a.userId))?.email || "",
        title: a.title,
        category: a.category,
        type: a.type,
        location: a.location,
        price: a.price,
        currency: a.currency,
        status: a.status,
        verified: a.verified,
        views: a.views,
        createdAt: a.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin ads error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
