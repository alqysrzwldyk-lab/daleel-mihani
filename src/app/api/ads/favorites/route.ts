import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { AdBoost } from "@/models/AdBoost";
import { Favorite } from "@/models/Favorite";
import { Professional } from "@/models/Professional";

export const dynamic = "force-dynamic";

// إعلاناتي المفضلة (للمستخدم الحالي)
export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    await connectDB();

    const favorites = await Favorite.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const adIds = favorites.map((f) => String(f.adId));

    const allAds = (await Ad.find({ _id: { $in: adIds } }).lean()) as unknown as {
      _id: unknown;
      userId?: unknown;
      title: string;
      description: string;
      type: string;
      category: string;
      price?: number | null;
      currency?: string;
      location: string;
      images?: string[];
      status: string;
      views: number;
      verified?: boolean;
      createdAt?: Date;
    }[];

    // ترتيب النتائج حسب ترتيب الحفظ (الأحدث أولاً)
    const orderMap = new Map(favorites.map((f, i) => [String(f.adId), i]));
    allAds.sort((a, b) => (orderMap.get(String(a._id)) ?? 0) - (orderMap.get(String(b._id)) ?? 0));

    const activeBoosts = await AdBoost.find({
      adId: { $in: adIds },
      status: "active",
      endDate: { $gte: new Date() },
    }).lean();
    const boostedIds = new Set(activeBoosts.map((b) => String(b.adId)));

    const userIds = [...new Set(allAds.map((a) => String(a.userId)).filter(Boolean))];
    const professionals = (await Professional.find({ userId: { $in: userIds } })
      .select("userId name photo averageRating ratingCount")
      .lean()) as unknown as {
      userId: unknown;
      name: string;
      photo?: string;
      averageRating?: number;
      ratingCount?: number;
    }[];
    const proMap = new Map(professionals.map((p) => [String(p.userId), p]));

    const ads = allAds.map((ad) => {
      const pro = proMap.get(String(ad.userId));
      return {
        ...ad,
        _id: String(ad._id),
        boosted: boostedIds.has(String(ad._id)),
        verified: !!ad.verified,
        seller: {
          name: pro?.name || "بائع",
          avatar: pro?.photo || null,
          averageRating: pro?.averageRating || 0,
          ratingCount: pro?.ratingCount || 0,
        },
      };
    });

    return NextResponse.json({ success: true, ads }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب المفضلة";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
