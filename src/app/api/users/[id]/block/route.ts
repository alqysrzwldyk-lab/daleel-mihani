import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// حظر / إلغاء حظر مستخدم (تختفي إعلاناته من نتائجي)
export async function POST(req: Request, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const wantBlock = body?.block !== false;

    if (String(id) === String(auth.userId)) {
      return NextResponse.json({ error: "لا يمكنك حظر نفسك" }, { status: 400 });
    }

    await connectDB();

    const me = await User.findById(auth.userId);
    if (!me) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const blocked = ((me.blockedUsers || []) as unknown[]).map((b: unknown) => String(b));
    const isBlocked = blocked.includes(String(id));

    if (wantBlock && !isBlocked) {
      me.blockedUsers = [...(me.blockedUsers || []), id];
    } else if (!wantBlock && isBlocked) {
      me.blockedUsers = ((me.blockedUsers || []) as unknown[]).filter((b: unknown) => String(b) !== String(id));
    }

    await me.save();

    return NextResponse.json({
      success: true,
      blocked: wantBlock ? !isBlocked || true : false,
      isBlocked: wantBlock,
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل تحديث الحظر";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// هل المستخدم محظور عندي؟
export async function GET(_req: Request, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const me = (await User.findById(auth.userId)
      .select("blockedUsers")
      .lean()) as unknown as { blockedUsers?: unknown[] } | null;

    const isBlocked = (me?.blockedUsers || []).some((b) => String(b) === String(id));

    return NextResponse.json({ success: true, isBlocked }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب حالة الحظر";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
