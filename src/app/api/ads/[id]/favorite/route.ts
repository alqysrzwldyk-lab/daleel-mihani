import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { Favorite } from "@/models/Favorite";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// إضافة إلى المفضلة
export async function POST(_req: Request, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }
    const { id } = await params;

    await connectDB();

    const ad = await Ad.findById(id).lean();
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    await Favorite.findOneAndUpdate(
      { userId: auth.userId, adId: id },
      { $setOnInsert: { userId: auth.userId, adId: id } },
      { upsert: true, new: true }
    );

    await Ad.findByIdAndUpdate(id, { $inc: { favoritesCount: 1 } });

    return NextResponse.json({ success: true, isFavorite: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل الحفظ في المفضلة";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// إزالة من المفضلة
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }
    const { id } = await params;

    await connectDB();

    await Favorite.deleteOne({ userId: auth.userId, adId: id });

    await Ad.updateOne({ _id: id, favoritesCount: { $gt: 0 } }, { $inc: { favoritesCount: -1 } });

    return NextResponse.json({ success: true, isFavorite: false }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل إزالة المفضلة";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
