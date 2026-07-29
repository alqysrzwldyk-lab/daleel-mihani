import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Ad } from "@/models/Ad";
import { AdBoost } from "@/models/AdBoost";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = { status: "active" };

    if (type) query.type = type;
    if (category) query.category = category;
    if (location && location !== "all") query.location = location;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const allAds = await Ad.find(query).sort({ createdAt: -1 }).limit(40);
    const adIds = allAds.map((a) => a._id);

    const activeBoosts = await AdBoost.find({
      adId: { $in: adIds },
      status: "active",
      endDate: { $gte: new Date() },
    }).lean();

    const boostedIds = new Set(activeBoosts.map((b) => String(b.adId)));

    const sorted = [
      ...allAds.filter((a) => boostedIds.has(String(a._id))),
      ...allAds.filter((a) => !boostedIds.has(String(a._id))),
    ];

    return NextResponse.json({ success: true, ads: sorted }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب الإعلانات العامة";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}