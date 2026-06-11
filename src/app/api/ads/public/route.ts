import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Ad } from "@/models/Ad";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // التقاط بارامترات الفلترة والبحث من الرابط (URL)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");         // general أو professional
    const category = searchParams.get("category"); // cars, lands, services...
    const location = searchParams.get("location"); // عمان، إربد...
    const search = searchParams.get("search");     // نص البحث الحر

    // 🌟 تم استبدال any بنوع مرن ومقبول في TypeScript لمنع الخطأ الأحمر
    const query: Record<string, unknown> = { status: "active" };

    if (type) query.type = type;
    if (category) query.category = category;
    if (location && location !== "all") query.location = location;
    
    // دعم البحث الذكي في العنوان والشرح
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const allAds = await Ad.find(query).sort({ createdAt: -1 }).limit(40);
    return NextResponse.json({ success: true, ads: allAds }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب الإعلانات العامة";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}