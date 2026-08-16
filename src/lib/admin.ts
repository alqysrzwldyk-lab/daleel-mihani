import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getAuthFromCookies, getAuthFromRequest, type AuthPayload } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { AdminAuditLog } from "@/models/AdminAuditLog";

// حماية صفحات الإدارة (Server Components): إعادة توجيه غير المصرح لهم
export async function requireAdmin(): Promise<AuthPayload> {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") {
    redirect("/login");
  }
  try {
    await connectDB();
    const user = await User.findById(auth.userId).select("role status");
    if (!user || user.role !== "admin" || user.status === "disabled") {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }
  return auth;
}

// حماية واجهات API: فحص التوكن ثم التحقق من دور admin في قاعدة البيانات
export async function requireAdminFromRequest(
  req: NextRequest
): Promise<AuthPayload | NextResponse> {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findById(auth.userId).select("role status");
    if (!user || user.role !== "admin" || user.status === "disabled") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "databaseUnavailable" }, { status: 503 });
  }
  return auth;
}

// تسجيل أي عملية إدارية في سجل التدقيق
export async function logAdminAction(params: {
  admin: AuthPayload;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  req?: NextRequest;
}) {
  try {
    await connectDB();
    await AdminAuditLog.create({
      adminId: params.admin.userId,
      adminEmail: params.admin.email,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details ?? {},
      ip:
        params.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        params.req?.headers.get("x-real-ip") ||
        undefined,
    });
  } catch (error) {
    console.error("AdminAuditLog error:", error);
  }
}

export function adminIdEquals(a: string, b: string): boolean {
  return a.toString() === b.toString();
}
