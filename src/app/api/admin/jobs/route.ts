import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { JobAdvertisement } from "@/models/JobAdvertisement";

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const status = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  const filter: Record<string, unknown> = {};
  if (status === "open" || status === "closed") filter.status = status;
  if (q) {
    filter.$or = [
      { jobTitle: { $regex: q, $options: "i" } },
      { companyName: { $regex: q, $options: "i" } },
      { department: { $regex: q, $options: "i" } },
      { city: { $regex: q, $options: "i" } },
    ];
  }

  try {
    await connectDB();
    const [total, jobs] = await Promise.all([
      JobAdvertisement.countDocuments(filter),
      JobAdvertisement.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: String(j._id),
        companyId: String(j.companyId),
        companyName: j.companyName,
        jobTitle: j.jobTitle,
        department: j.department,
        city: j.city,
        workType: j.workType,
        status: j.status,
        views: j.views,
        applicationsCount: j.applicationsCount,
        createdAt: j.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin jobs error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
