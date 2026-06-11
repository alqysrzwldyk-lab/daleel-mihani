import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";

// حذف إعلان من المحفظة
// 🌟 تم تحديث تعريف params ليكون كـ Promise متوافق مع Next.js الحديث
export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالعملية" }, { status: 401 });
    }

    await connectDB();
    
    // 🌟 فك الوعد (Await) للـ params لاستخراج الـ id بأمان ومنع خطأ المترجم
    const resolvedParams = await params;
    const adId = resolvedParams.id;

    // التأكد من أن المستخدم هو صاحب الإعلان الفعلي قبل الحذف لحماية البيانات
    const ad = await Ad.findById(adId);
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    // التحقق من ملكية الإعلان عبر حماية تيب الـ IDs وتحويلها لنصوص
    if (ad.userId?.toString() !== auth.userId.toString()) {
      return NextResponse.json({ error: "لا تملك صلاحية حذف هذا الإعلان" }, { status: 403 });
    }

    await Ad.findByIdAndDelete(adId);
    return NextResponse.json({ success: true, message: "تم حذف الإعلان من محفظتك بنجاح" }, { status: 200 });
    
  } catch (error) {
    // 🌟 حماية الـ catch واستخراج نص الخطأ الفعلي لتجاوز فحص TypeScript الصارم
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء الحذف";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}