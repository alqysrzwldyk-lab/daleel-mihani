import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { AdminAuditLog } from "@/models/AdminAuditLog";

// لا يتم كشف أي أسرار هنا — معلومات أمنية عامة فقط.
const SENSITIVE_ACTIONS = [
  "disableUser",
  "enableUser",
  "deleteRating",
  "report:removed",
  "broadcastNotification",
  "verifyCompany",
  "unverifyCompany",
  "updateAd",
];

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();

    const [totalAdmins, disabledAccounts, totalLogs, recentActivity, sensitive] = await Promise.all([
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ status: "disabled" }),
      AdminAuditLog.countDocuments(),
      AdminAuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      AdminAuditLog.find({ action: { $in: SENSITIVE_ACTIONS } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return NextResponse.json({
      jwtConfigured: Boolean(process.env.JWT_SECRET),
      environment: process.env.NODE_ENV || "development",
      totalAdmins,
      disabledAccounts,
      totalLogs,
      unauthorizedLogsAvailable: false,
      recentActivity: recentActivity.map((l) => ({
        id: String(l._id),
        adminEmail: l.adminEmail,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        createdAt: l.createdAt,
      })),
      sensitiveActions: sensitive.map((l) => ({
        id: String(l._id),
        adminEmail: l.adminEmail,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        details: l.details,
        ip: l.ip,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin security error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
