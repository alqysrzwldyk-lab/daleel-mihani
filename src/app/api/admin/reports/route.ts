import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { AdReport } from "@/models/AdReport";
import { UserReport } from "@/models/UserReport";
import { Ad } from "@/models/Ad";
import { User } from "@/models/User";

type ReportLean = {
  _id: string;
  adId?: string;
  targetUserId?: string;
  reporterUserId: string;
  sellerUserId?: string;
  reason: string;
  note?: string;
  status: string;
  createdAt: Date;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "pending";
  const type = searchParams.get("type") || "all";
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  const validStatus = ["pending", "reviewed", "removed"].includes(status) ? status : "pending";

  try {
    await connectDB();

    const adFilter: Record<string, unknown> = { status: validStatus };
    const userFilter: Record<string, unknown> = { status: validStatus };
    if (q) {
      const qRegex = { $regex: q, $options: "i" };
      adFilter.$or = [{ reason: qRegex }, { note: qRegex }];
      userFilter.$or = [{ reason: qRegex }, { note: qRegex }];
    }

    const [adReports, userReports, ads, users] = await Promise.all([
      type === "all" || type === "ad" ? AdReport.find(adFilter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean() : [],
      type === "all" || type === "user" ? UserReport.find(userFilter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean() : [],
      Ad.find({}).select("_id title").lean(),
      User.find({}).select("_id name email").lean(),
    ]);
    const adReportsTyped = adReports as unknown as ReportLean[];
    const userReportsTyped = userReports as unknown as ReportLean[];

    const adMap = new Map(ads.map((a) => [String(a._id), a.title]));
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const combined = [
      ...adReportsTyped.map((r) => ({
        id: String(r._id),
        type: "ad",
        targetId: r.adId || "",
        targetLabel: (r.adId && adMap.get(r.adId)) || r.adId || "",
        reporterId: String(r.reporterUserId),
        reporterName: userMap.get(String(r.reporterUserId))?.name || "",
        sellerId: r.sellerUserId || "",
        sellerName: (r.sellerUserId && userMap.get(r.sellerUserId)?.name) || "",
        reason: r.reason,
        note: r.note || "",
        status: r.status,
        createdAt: r.createdAt,
      })),
      ...userReportsTyped.map((r) => ({
        id: String(r._id),
        type: "user",
        targetId: r.targetUserId || "",
        targetLabel: (r.targetUserId && userMap.get(r.targetUserId)?.name) || r.targetUserId || "",
        reporterId: String(r.reporterUserId),
        reporterName: userMap.get(String(r.reporterUserId))?.name || "",
        sellerId: r.targetUserId || "",
        sellerName: (r.targetUserId && userMap.get(r.targetUserId)?.name) || "",
        reason: r.reason,
        note: r.note || "",
        status: r.status,
        createdAt: r.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const [adTotal, userTotal] = await Promise.all([
      AdReport.countDocuments(adFilter),
      UserReport.countDocuments(userFilter),
    ]);

    return NextResponse.json({
      reports: combined,
      total: adTotal + userTotal,
      adTotal,
      userTotal,
      page,
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
