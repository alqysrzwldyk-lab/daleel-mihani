import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { AdBoost } from "@/models/AdBoost";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";

export const dynamic = "force-dynamic";

const DEFAULT_STATUSES = ["active", "coming_soon"];
const ALL_STATUSES = ["active", "paused", "sold", "reserved", "expired", "coming_soon", "archived"];

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const search = searchParams.get("search");
    const statusParam = searchParams.get("status");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const verified = searchParams.get("verified") === "1";
    const newOnly = searchParams.get("newOnly") === "1";
    const boostedOnly = searchParams.get("boostedOnly") === "1";
    const minRating = Number(searchParams.get("minRating") || 0);
    const sort = searchParams.get("sort") || "new";

    const query: Record<string, unknown> = {};

    // فلترة الحالة (المرحلة 4): الكل أو حالة محددة، والافتراضي متوفر + قريباً
    if (statusParam && statusParam !== "all") {
      const statuses = statusParam.split(",").filter((s) => ALL_STATUSES.includes(s));
      if (statuses.length === 1) {
        query.status = statuses[0];
      } else if (statuses.length > 1) {
        query.status = { $in: statuses };
      }
    } else {
      query.status = { $in: DEFAULT_STATUSES };
    }

    if (type && type !== "all") query.type = type;
    if (category && category !== "all") query.category = category;
    if (location && location !== "all") query.location = location;
    if (minPrice) {
      const v = Number(minPrice);
      if (!Number.isNaN(v)) query.price = { ...(query.price as object), $gte: v };
    }
    if (maxPrice) {
      const v = Number(maxPrice);
      if (!Number.isNaN(v)) query.price = { ...(query.price as object), $lte: v };
    }
    if (verified) query.verified = true;
    if (newOnly) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
      query.createdAt = { $gte: sevenDaysAgo };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // استبعاد إعلانات المستخدمين المحظورين والإعلانات المخفية للمستخدم الحالي (المرحلة 10)
    const auth = await getAuthFromCookies();
    if (auth?.userId) {
      const me = (await User.findById(auth.userId)
        .select("blockedUsers hiddenAds")
        .lean()) as unknown as { blockedUsers?: unknown[]; hiddenAds?: unknown[] } | null;
      const blocked = (me?.blockedUsers || []).map((b) => String(b));
      const hidden = (me?.hiddenAds || []).map((h) => String(h));
      if (blocked.length > 0) {
        const blockedAdIds = await Ad.find({ userId: { $in: blocked } }).select("_id").lean();
        const ids = blockedAdIds.map((b) => b._id);
        if (ids.length > 0) {
          query._id = { $nin: ids };
        }
      }
      if (hidden.length > 0) {
        const prev = (query._id as Record<string, unknown>) || {};
        query._id = { ...prev, $nin: hidden };
      }
    }

    // وضع "المعزز فقط"
    let boostedOnlyIds: string[] | null = null;
    if (boostedOnly) {
      const activeBoosts = await AdBoost.find({
        status: "active",
        endDate: { $gte: new Date() },
      }).select("adId").lean();
      boostedOnlyIds = activeBoosts.map((b) => String(b.adId));
      query._id = { ...(query._id as object), $in: boostedOnlyIds };
    }

    const allAds = await Ad.find(query).sort({ createdAt: -1 }).limit(120);
    const adIds = allAds.map((a) => a._id);

    const activeBoosts = await AdBoost.find({
      adId: { $in: adIds },
      status: "active",
      endDate: { $gte: new Date() },
    }).lean();

    const boostedIds = new Set(activeBoosts.map((b) => String(b.adId)));

    const userIds = [...new Set(allAds.map((a) => String(a.userId)).filter(Boolean))];

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
      .select("userId name photo averageRating ratingCount")
      .lean()) as unknown as {
      userId: unknown;
      name: string;
      photo?: string;
      averageRating?: number;
      ratingCount?: number;
    }[];

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const proMap = new Map(professionals.map((p) => [String(p.userId), p]));

    let enriched = allAds.map((ad) => {
      const uid = String(ad.userId);
      const pro = proMap.get(uid);
      const usr = userMap.get(uid);
      const rating = usr?.averageRating || pro?.averageRating || 0;
      return {
        ...ad.toObject(),
        boosted: boostedIds.has(String(ad._id)),
        verified: !!ad.verified,
        seller: {
          name: pro?.name || usr?.name || "بائع",
          avatar: pro?.photo || usr?.avatar || null,
          averageRating: rating,
          ratingCount: usr?.ratingCount || pro?.ratingCount || 0,
        },
      };
    });

    // فلترة التقييم (المرحلة 5): بعد إثراء بيانات البائع
    if (minRating > 0) {
      enriched = enriched.filter((a) => (a.seller.averageRating || 0) >= minRating);
    }

    // ترتيب: المعزز أولاً ثم حسب معيار الترتيب المحدد
    if (sort === "price_asc") {
      enriched.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    } else if (sort === "price_desc") {
      enriched.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    } else if (sort === "views") {
      enriched.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    const sorted = [
      ...enriched.filter((a) => a.boosted),
      ...enriched.filter((a) => !a.boosted),
    ];

    return NextResponse.json({ success: true, ads: sorted }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب الإعلانات العامة";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
