import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";

export const dynamic = "force-dynamic";

// إيقاف الإعلان مؤقتاً أو إعادة تفعيله
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالعملية" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const adId = resolvedParams.id;

    const body = await request.json();
    const newStatus = body?.status;

    const VALID_STATUSES = ["active", "paused", "sold", "reserved", "expired", "coming_soon", "archived"];
    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    }

    const ad = await Ad.findById(adId).select("_id userId status");
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    if (ad.userId?.toString() !== auth.userId.toString()) {
      return NextResponse.json({ error: "لا تملك صلاحية تعديل هذا الإعلان" }, { status: 403 });
    }

    ad.status = newStatus;
    await ad.save();

    const message =
      newStatus === "active" ? "تم إعادة تفعيل الإعلان"
      : newStatus === "paused" ? "تم إيقاف الإعلان مؤقتاً"
      : newStatus === "sold" ? "تم تحديد الإعلان كمباع"
      : newStatus === "reserved" ? "تم تحديد الإعلان كمحجوز"
      : newStatus === "coming_soon" ? "تم تحديد الإعلان كقريب"
      : newStatus === "expired" ? "تم تحديد الإعلان كمنتهي"
      : "تم تحديث حالة الإعلان";

    return NextResponse.json({ success: true, message, status: ad.status }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل تحديث حالة الإعلان";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
