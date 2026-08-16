import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Ad } from "@/models/Ad";
import { incrementAdStat } from "@/lib/adStats";

export const dynamic = "force-dynamic";

// تسجيل عملية مشاركة للإعلان (رفع عداد المشاركات)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const adId = resolvedParams.id;

    const ad = await Ad.findById(adId).select("_id");
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    await Ad.findByIdAndUpdate(adId, { $inc: { sharesCount: 1 } });
    await incrementAdStat(ad._id, "shares");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل تسجيل المشاركة";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
