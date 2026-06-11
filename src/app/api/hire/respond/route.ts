import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { HireRequest } from "@/models/HireRequest";
import { Notification } from "@/models/Notification";

// منع التخزين المؤقت لردود الأفعال لضمان السرعة اللحظية
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    
    // 1. التحقق من تسجيل دخول المستخدم الحالي (المهني)
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    await connectDB();

    // 2. استقبال بيانات القرار من الواجهة
    const { companyId, status } = await request.json();

    if (!companyId || !status || !["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 });
    }

    const cleanEmployerId = companyId.toString().trim();
    const cleanProfessionalId = auth.userId.toString().trim(); 

    // 3. تحديث حالة طلب التوظيف في قاعدة البيانات من (pending) إلى القرار الجديد
    const updatedRequest = await HireRequest.findOneAndUpdate(
      {
        employerId: cleanEmployerId,
        professionalId: cleanProfessionalId,
        status: "pending" 
      },
      { status: status },
      { new: true }
    );

    // 💡 حل مرن للاحتياط
    if (!updatedRequest) {
      const profileIdFallback = cleanProfessionalId.slice(0, -2) + "0a";
      await HireRequest.findOneAndUpdate(
        {
          employerId: cleanEmployerId,
          $or: [
            { professionalId: cleanProfessionalId },
            { professionalId: profileIdFallback }
          ]
        },
        { status: status }
      );
    }

    // 4. إرسال إشعار فوري لصاحب الشركة (Employer) ليصله رد المهني عزام 🎉
    const statusText = status === "accepted" ? "✅ قبل عرض العمل الخاص بك!" : "❌ اعتذر عن عرض العمل.";
    
    await Notification.create({
      recipientId: cleanEmployerId,
      title: "🔔 تحديث بشأن طلب التوظيف",
      message: `قام المهني بالرد على طلبك: ${statusText} يمكنك الآن مراجعة لوحة التحكم للتفاصيل.`,
      type: status === "accepted" ? "success" : "error",
      link: "/dashboard", 
    });

    const response = NextResponse.json({ 
      success: true, 
      message: status === "accepted" ? "تم قبول العرض بنجاح" : "تم رفض العرض بنجاح" 
    }, { status: 200 });

    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;

  } catch (error) {
    console.error("Error in respond API:", error);
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ داخلي في السيرفر";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}