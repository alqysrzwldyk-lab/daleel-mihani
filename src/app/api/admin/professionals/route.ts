import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Professional } from "@/models/Professional";

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const verified = searchParams.get("verified") || "";
  const active = searchParams.get("active") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { professions: { $regex: q, $options: "i" } },
    ];
  }
  if (verified === "true" || verified === "false") filter.verified = verified === "true";
  if (active === "true" || active === "false") filter.isActive = active === "true";

  try {
    await connectDB();
    const [total, pros] = await Promise.all([
      Professional.countDocuments(filter),
      Professional.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      professionals: pros.map((p) => ({
        id: String(p._id),
        userId: String(p.userId),
        name: p.name,
        email: p.email,
        profession: p.professions?.[0] || "other",
        location: p.location,
        isActive: p.isActive,
        verified: p.verified,
        averageRating: p.averageRating,
        ratingCount: p.ratingCount,
        createdAt: p.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin professionals error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
