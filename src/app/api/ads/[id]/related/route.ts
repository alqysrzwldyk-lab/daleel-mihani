import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { AdBoost } from "@/models/AdBoost";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";

export const dynamic = "force-dynamic";

type AdLean = {
  _id: unknown;
  userId?: unknown;
  type: string;
  category: string;
  title: string;
  description: string;
  price?: number | null;
  currency?: string;
  location: string;
  images?: string[];
  status: string;
  verified?: boolean;
  views: number;
  createdAt?: Date;
};

// اقتراحات ذكية: إعلانات مشابهة (نفس القسم / نفس المدينة / سعر قريب) + قد يعجبك
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const ad = (await Ad.findById(id).lean()) as unknown as AdLean | null;
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    // استبعاد المحظور/المخفي بالنسبة للمستخدم الحالي
    const auth = await getAuthFromCookies();
    let excludedIds: string[] = [];
    let blockedUserIds: string[] = [];
    if (auth?.userId) {
      const me = (await User.findById(auth.userId)
        .select("blockedUsers hiddenAds")
        .lean()) as unknown as { blockedUsers?: unknown[]; hiddenAds?: unknown[] } | null;
      blockedUserIds = (me?.blockedUsers || []).map((b) => String(b));
      excludedIds = (me?.hiddenAds || []).map((h) => String(h));
    }

    const blockQuery: Record<string, unknown> = {};
    if (blockedUserIds.length > 0) {
      const blockedAdIds = await Ad.find({ userId: { $in: blockedUserIds } }).select("_id").lean();
      excludedIds.push(...blockedAdIds.map((b) => String(b._id)));
    }
    if (excludedIds.length > 0) {
      blockQuery._id = { $nin: excludedIds };
    }

    const candidates = (await Ad.find({
      _id: { $ne: id },
      status: { $in: ["active", "coming_soon"] },
      ...blockQuery,
      $or: [
        { category: ad.category },
        { location: ad.location },
        ...(ad.price != null && ad.price > 0
          ? [
              {
                price: {
                  $gte: Math.max(0, ad.price * 0.7),
                  $lte: ad.price * 1.3,
                },
              },
            ]
          : []),
      ],
    })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean()) as unknown as AdLean[];

    // نقاط التشابه
    const scored = candidates
      .map((c) => {
        let score = 0;
        if (c.category === ad.category) score += 10;
        if (c.location === ad.location) score += 5;
        if (
          ad.price != null &&
          ad.price > 0 &&
          c.price != null &&
          Math.abs(c.price - ad.price) <= ad.price * 0.3
        ) {
          score += 3;
        }
        if (c.verified) score += 2;
        if (c.views) score += Math.min(2, c.views / 100);
        return { ad: c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ ad: c }) => c);

    const adIds = scored.map((c) => c._id);

    const activeBoosts = await AdBoost.find({
      adId: { $in: adIds },
      status: "active",
      endDate: { $gte: new Date() },
    }).lean();
    const boostedIds = new Set(activeBoosts.map((b) => String(b.adId)));

    const userIds = [...new Set(scored.map((c) => String(c.userId)).filter(Boolean))];
    const users = (await User.find({ _id: { $in: userIds } })
      .select("name avatar averageRating ratingCount")
      .lean()) as unknown as {
      _id: unknown;
      name: string;
      avatar?: string;
      averageRating?: number;
      ratingCount?: number;
    }[];
    const professionals = (await Professional.find({ userId: { $in: userIds } })
      .select("userId name photo")
      .lean()) as unknown as { userId: unknown; name: string; photo?: string }[];

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const proMap = new Map(professionals.map((p) => [String(p.userId), p]));

    const related = scored.map((c) => {
      const uid = String(c.userId);
      const usr = userMap.get(uid);
      const pro = proMap.get(uid);
      return {
        ...c,
        _id: String(c._id),
        boosted: boostedIds.has(String(c._id)),
        verified: !!c.verified,
        seller: {
          name: pro?.name || usr?.name || "بائع",
          avatar: pro?.photo || usr?.avatar || null,
          averageRating: usr?.averageRating || 0,
          ratingCount: usr?.ratingCount || 0,
        },
      };
    });

    return NextResponse.json({ success: true, related }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب الإعلانات المشابهة";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
