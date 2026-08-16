import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { User } from "@/models/User";
import { SellerRating } from "@/models/SellerRating";
import { Notification } from "@/models/Notification";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// تقييم البائع بعد التعامل (مستخدم مهتم يقيّم صاحب الإعلان)
export async function POST(req: Request, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const score = Number(body.score);
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : "";

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ error: "التقييم يجب أن يكون من 1 إلى 5" }, { status: 400 });
    }

    await connectDB();

    const ad = (await Ad.findById(id).select("userId title").lean()) as unknown as {
      _id: unknown;
      userId?: unknown;
      title: string;
    } | null;
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    if (!ad.userId || String(ad.userId) === String(auth.userId)) {
      return NextResponse.json({ error: "لا يمكنك تقييم إعلانك الخاص" }, { status: 400 });
    }

    // إضافة أو تحديث تقييم المستخدم لهذا البائع
    await SellerRating.findOneAndUpdate(
      { sellerUserId: ad.userId, raterUserId: auth.userId },
      { $set: { adId: ad._id, score, comment } },
      { upsert: true, new: true }
    );

    // إعادة حساب المتوسط والعدد
    const stats = await SellerRating.aggregate([
      { $match: { sellerUserId: ad.userId } },
      {
        $group: {
          _id: null,
          average: { $avg: "$score" },
          count: { $sum: 1 },
        },
      },
    ]);

    const averageRating = Math.round((stats[0]?.average || 0) * 10) / 10;
    const ratingCount = stats[0]?.count || 0;

    await User.findByIdAndUpdate(ad.userId, { averageRating, ratingCount });

    try {
      const rater = await User.findById(auth.userId).select("name");
      await Notification.create({
        recipientId: ad.userId,
        title: `⭐ تقييم جديد`,
        message: `قام "${rater?.name || "مستخدم"}" بتقييمك ${score} من 5 بعد التعامل${comment ? ` مع تعليق: "${comment}"` : ""}.`,
        type: "info",
        link: `/ads/${id}`,
        data: { action: "seller_rating", score },
      });
    } catch {}

    return NextResponse.json({ success: true, averageRating, ratingCount }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل تقييم البائع";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// جلب تقييم المستخدم الحالي لهذا البائع (إن وُجد)
export async function GET(_req: Request, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const ad = (await Ad.findById(id).select("userId").lean()) as unknown as {
      _id: unknown;
      userId?: unknown;
    } | null;
    if (!ad || !ad.userId) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    const existing = (await SellerRating.findOne({
      sellerUserId: ad.userId,
      raterUserId: auth.userId,
    }).lean()) as unknown as { score?: number; comment?: string } | null;

    return NextResponse.json({
      success: true,
      myRating: existing ? { score: existing.score, comment: existing.comment } : null,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب التقييم";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
