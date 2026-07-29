import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { Transaction } from "@/models/Transaction";
import { Notification } from "@/models/Notification";

const COMMISSION_RATE = 0.05;

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { adId, message } = await request.json();
    if (!adId) {
      return NextResponse.json({ error: "معرف الإعلان مطلوب" }, { status: 400 });
    }

    await connectDB();

    const ad = await Ad.findById(adId);
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    if (ad.userId?.toString() === auth.userId) {
      return NextResponse.json({ error: "لا يمكنك التواصل مع إعلانك الخاص" }, { status: 400 });
    }

    const amount = ad.price || 0;
    const fee = Math.round(amount * COMMISSION_RATE);

    const transaction = await Transaction.create({
      fromUserId: auth.userId,
      toUserId: ad.userId,
      type: "payment",
      amount,
      fee,
      currency: ad.currency || "YER",
      status: amount > 0 ? "pending" : "completed",
      refType: "ad",
      refId: adId,
      note: message?.slice(0, 200),
    });

    if (Notification) {
      try {
        await Notification.create({
          userId: ad.userId,
          type: "inquiry",
          title: "طلب جديد على إعلانك",
          message: `هناك طلب جديد على "${ad.title}"`,
          refType: "ad",
          refId: adId,
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "تم إرسال طلبك، يمكن لصاحب الإعلان التواصل معك",
      transaction,
    });
  } catch (error) {
    return NextResponse.json({ error: "فشل إرسال الطلب" }, { status: 500 });
  }
}
