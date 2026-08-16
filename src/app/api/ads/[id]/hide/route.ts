import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// إخفاء / إظهار إعلان (يختفي من نتائجي)
export async function POST(req: Request, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const wantHide = body?.hide !== false;

    await connectDB();

    const me = await User.findById(auth.userId);
    if (!me) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const hidden = ((me.hiddenAds || []) as unknown[]).map((h: unknown) => String(h));
    const isHidden = hidden.includes(String(id));

    if (wantHide && !isHidden) {
      me.hiddenAds = [...(me.hiddenAds || []), id];
    } else if (!wantHide && isHidden) {
      me.hiddenAds = ((me.hiddenAds || []) as unknown[]).filter((h: unknown) => String(h) !== String(id));
    }

    await me.save();

    return NextResponse.json({ success: true, isHidden: wantHide }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل تحديث الإخفاء";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// هل الإعلان مخفي عندي؟
export async function GET(_req: Request, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const me = (await User.findById(auth.userId)
      .select("hiddenAds")
      .lean()) as unknown as { hiddenAds?: unknown[] } | null;

    const isHidden = (me?.hiddenAds || []).some((h) => String(h) === String(id));

    return NextResponse.json({ success: true, isHidden }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب حالة الإخفاء";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
