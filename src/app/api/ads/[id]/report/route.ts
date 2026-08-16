import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { AdReport } from "@/models/AdReport";

export const dynamic = "force-dynamic";

// الإبلاغ عن إعلان
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول للإبلاغ" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const adId = resolvedParams.id;

    const body = await request.json();
    const reason = String(body?.reason || "").trim();
    if (!reason) {
      return NextResponse.json({ error: "يرجى اختيار سبب البلاغ" }, { status: 400 });
    }

    const ad = await Ad.findById(adId).select("_id userId");
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    if (String(ad.userId) === String(auth.userId)) {
      return NextResponse.json({ error: "لا يمكنك الإبلاغ عن إعلانك الخاص" }, { status: 400 });
    }

    await AdReport.create({
      adId,
      reporterUserId: auth.userId,
      sellerUserId: ad.userId,
      reason,
      note: String(body?.note || "").slice(0, 500),
    });

    return NextResponse.json(
      { success: true, message: "تم إرسال البلاغ، شكراً لمساهمتك في سلامة المنصة" },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل إرسال البلاغ";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
