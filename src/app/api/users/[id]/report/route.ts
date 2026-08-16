import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { User } from "@/models/User";
import { UserReport } from "@/models/UserReport";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const REPORT_REASONS = [
  "احتيال أو نصب",
  "مضايقة أو سلوك مسيء",
  "معلومات مضللة",
  "انتحال شخصية",
  "محتوى مخالف",
  "أخرى",
];

// الإبلاغ عن مستخدم (بائع)
export async function POST(req: Request, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول للإبلاغ" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const reason = String(body?.reason || "").trim();
    if (!reason || !REPORT_REASONS.includes(reason)) {
      return NextResponse.json({ error: "يرجى اختيار سبب البلاغ" }, { status: 400 });
    }

    await connectDB();

    if (String(id) === String(auth.userId)) {
      return NextResponse.json({ error: "لا يمكنك الإبلاغ عن نفسك" }, { status: 400 });
    }

    const target = await User.findById(id).select("_id");
    if (!target) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    await UserReport.create({
      targetUserId: id,
      reporterUserId: auth.userId,
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
