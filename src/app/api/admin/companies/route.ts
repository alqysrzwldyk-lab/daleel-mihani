import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Company } from "@/models/Company";

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const verified = searchParams.get("verified") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { industry: { $regex: q, $options: "i" } },
    ];
  }
  if (verified === "true" || verified === "false") filter.verified = verified === "true";

  try {
    await connectDB();
    const [total, companies] = await Promise.all([
      Company.countDocuments(filter),
      Company.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      companies: companies.map((c) => ({
        id: String(c._id),
        userId: String(c.userId),
        name: c.name,
        email: c.email || "",
        industry: c.industry || "",
        city: c.city || "",
        verified: c.verified,
        views: c.views,
        createdAt: c.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin companies error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
