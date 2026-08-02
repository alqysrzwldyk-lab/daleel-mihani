import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { HireRequest } from "@/models/HireRequest";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    await connectDB();

    const employerUser = await User.findById(auth.userId);
    if (!employerUser || employerUser.role !== "employer") {
      return NextResponse.json(
        { error: "عذراً، أصحاب الشركات فقط من يمكنهم إرسال طلبات التوظيف" },
        { status: 403 }
      );
    }

    const { professionalId, companyName, title, message } = await request.json();
    if (!professionalId || !companyName || !title || !message) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // resolve target user: professionalId may be a User id or a Professional doc id
    let targetUser = await User.findById(professionalId);
    if (!targetUser) {
      const professionalDoc = await Professional.findById(professionalId);
      if (professionalDoc?.userId) {
        targetUser = await User.findById(professionalDoc.userId);
      }
    }

    if (!targetUser || targetUser.role !== "professional") {
      return NextResponse.json({ error: "المهني غير موجود" }, { status: 404 });
    }

    const hireRequest = await HireRequest.create({
      employerId: auth.userId,
      professionalId: targetUser._id,
      companyName,
      title,
      message,
      status: "pending",
    });

    await Notification.create({
      recipientId: targetUser._id,
      title: `عرض عمل جديد من ${companyName}`,
      message: `أرسلت لك شركة "${companyName}" عرض عمل بعنوان: "${title}". يمكنك قبول العرض أو رفضه من زرّي القبول والرفض.`,
      type: "info",
      link: `/hire/${hireRequest._id}`,
      data: {
        action: "hire",
        hireRequestId: String(hireRequest._id),
        status: "pending",
        senderName: companyName,
        companyName,
        title,
        message,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إرسال الطلب وسيصلك رد المهني فور اتخاذه القرار",
        hireRequestId: String(hireRequest._id),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Hire error:", error);
    return NextResponse.json({ error: "حدث خطأ ما" }, { status: 500 });
  }
}
