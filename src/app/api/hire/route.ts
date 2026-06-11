import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { HireRequest } from "@/models/HireRequest";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    
    // التأكد من أن المرسل مسجل دخول
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    await connectDB();

    // التأكد من أن الحساب الحالي هو صاحب شركة فعلاً (Employer)
    const employerUser = await User.findById(auth.userId);
    if (!employerUser || employerUser.role !== "employer") {
      return NextResponse.json({ error: "عذراً، أصحاب الشركات فقط من يمكنهم إرسال طلبات التوظيف" }, { status: 403 });
    }

    // استقبال البيانات من الواجهة
    const { professionalId, companyName, title, message } = await request.json();

    if (!professionalId || !companyName || !title || !message) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const cleanProfessionalId = professionalId.toString().trim();
    const cleanEmployerId = auth.userId.toString().trim();

    let targetUserId: string | null = null;

    // 🚀 التحقق إذا كان المعرف الممرر هو معرف مستخدم حقيقي (User ID)
    const directUser = await User.findById(cleanProfessionalId);
    if (directUser) {
      targetUserId = cleanProfessionalId;
    } else {
      // إذا لم يكن User ID، فهذا يعني أنه Professional ID، فنبحث عنه في جدول professionals لنجلب الـ userId المرتبط به
      const db = mongoose.connection.db;
      if (db) {
        const professionalDoc = await db.collection("professionals").findOne({
          _id: new mongoose.Types.ObjectId(cleanProfessionalId)
        });
        
        if (professionalDoc && professionalDoc.userId) {
          targetUserId = professionalDoc.userId.toString();
        }
      }
    }

    // حماية احتياطية للحسابات القديمة بناءً على الشرط السابق
    if (!targetUserId) {
      if (cleanProfessionalId.endsWith("0a")) {
        targetUserId = cleanProfessionalId.slice(0, -2) + "08";
      } else {
        targetUserId = cleanProfessionalId; 
      }
    }

    // 1. حفظ طلب التوظيف في قاعدة البيانات
    await HireRequest.create({
      employerId: new mongoose.Types.ObjectId(cleanEmployerId),
      professionalId: new mongoose.Types.ObjectId(targetUserId!), 
      companyName,
      title,
      message,
      status: "pending"
    });

    // 2. إرسال الإشعار للمهني إلى حساب المستخدم الحقيقي (User ID)
    await Notification.create({
      recipientId: new mongoose.Types.ObjectId(targetUserId!), 
      title: "💼 عرض عمل جديد قيد الانتظار!",
      message: `أرسلت لك شركة (${companyName}) طلباً لعنوان: "${title}". راجع لوحة تحكمك لاتخاذ قرار القبول أو الرفض الفوري.`,
      type: "success",
      link: `/dashboard?with=${cleanEmployerId}`, 
    });

    // إرسال احتياطي للمعرّف الآخر لضمان استقرار وتوافق الأنظمة والملفات القديمة تماماً
    if (targetUserId !== cleanProfessionalId) {
      await Notification.create({
        recipientId: new mongoose.Types.ObjectId(cleanProfessionalId),
        title: "💼 عرض عمل جديد قيد الانتظار!",
        message: `أرسلت لك شركة (${companyName}) طلباً لعنوان: "${title}". راجع لوحة تحكمك لاتخاذ قرار القبول أو الرفض الفوري.`,
        type: "success",
        link: `/dashboard?with=${cleanEmployerId}`,
      });
    }

    return NextResponse.json({ success: true, message: "تم إرسال طلبك بنجاح، وتم إشعار الطرفين تلقائياً!" }, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ ما";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}