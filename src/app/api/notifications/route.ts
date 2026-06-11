import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Notification } from "@/models/Notification";
import { isRateLimited } from "@/lib/rateLimit"; // 💡 الحفاظ على نظام الحماية
import mongoose from "mongoose";

// 🚀 تفعيل الاسترجاع الديناميكي المطلق لمنع كاش السيرفر نهائياً
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 💡 1. التقاط الـ IP الخاص بالمستخدِم بأمان من الترويسات لحماية المسار
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    // تفعيل الحماية: بحد أقصى 25 طلب كل 60 ثانية (دقيقة) لكل IP
    const limited = isRateLimited(ip, { windowMs: 60 * 1000, maxRequests: 25 });
    if (limited) {
      return NextResponse.json(
        { error: "طلبات كثيرة جداً! يرجى الانتظار قليلاً." },
        { status: 429 } // Too Many Requests
      );
    }

    // 2. التحقق من جلسة المستخدم
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    await connectDB();

    const currentUserIdStr = auth.userId.toString().trim();
    const currentUserIdObj = new mongoose.Types.ObjectId(currentUserIdStr);

    // 3. الفلترة الهجينة المتقدمة: جلب الإشعار سواء كان محفوظاً كنص أو ObjectId حقيقي لمنع مشاكل التحويل
    const userNotifications = await Notification.find({
      $or: [
        { recipientId: currentUserIdObj },
        { recipientId: currentUserIdStr }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20); 

    // حساب عدد الإشعارات غير المقروءة لهذا المستخدم فقط تلقائياً من قاعدة البيانات بناء على نفس الشرط الشامل
    const unreadCount = await Notification.countDocuments({
      $or: [
        { recipientId: currentUserIdObj },
        { recipientId: currentUserIdStr }
      ],
      isRead: false
    });

    const response = NextResponse.json({ notifications: userNotifications, unreadCount }, { status: 200 });
    
    // 💡 تدمير كاش المتصفح للإشعارات لتعمل بشكل فوري ولحظي
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ ما";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const { recipientId, title, message, type, link } = await request.json();

    if (!recipientId || !title || !message) {
      return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const newNotification = await Notification.create({
      recipientId: new mongoose.Types.ObjectId(recipientId),
      title,
      message,
      type,
      link,
    });

    return NextResponse.json({ success: true, notification: newNotification }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ ما";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}