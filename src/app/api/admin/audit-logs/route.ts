import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { AdminAuditLog } from "@/models/AdminAuditLog";

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const admin = (searchParams.get("admin") || "").trim();
  const action = (searchParams.get("action") || "").trim();
  const resource = (searchParams.get("resource") || "").trim();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10) || 30));

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { adminEmail: { $regex: q, $options: "i" } },
      { action: { $regex: q, $options: "i" } },
      { resource: { $regex: q, $options: "i" } },
      { resourceId: { $regex: q, $options: "i" } },
    ];
  }
  if (admin) filter.adminEmail = { $regex: admin, $options: "i" };
  if (action) filter.action = { $regex: action, $options: "i" };
  if (resource) filter.resource = { $regex: resource, $options: "i" };

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
    const [total, logs] = await Promise.all([
      AdminAuditLog.countDocuments(filter),
      AdminAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: String(l._id),
        adminId: String(l.adminId),
        adminEmail: l.adminEmail,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        details: l.details,
        ip: l.ip,
        createdAt: l.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin audit logs error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
