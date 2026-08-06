import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { AdBoost } from "@/models/AdBoost";
import { Wallet } from "@/models/Wallet";
import { Transaction } from "@/models/Transaction";

const BOOST_PRICES: Record<string, number> = {
  "3": 1000,
  "7": 2000,
  "30": 5000,
};

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { adId, days } = await request.json();
    if (!adId || !BOOST_PRICES[String(days)]) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    await connectDB();

    const ad = await Ad.findById(adId);
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }
    if (ad.userId?.toString() !== auth.userId) {
      return NextResponse.json({ error: "لا تملك صلاحية تعزيز هذا الإعلان" }, { status: 403 });
    }

    const price = BOOST_PRICES[String(days)];

    const wallet = await Wallet.findOne({ userId: auth.userId });
    if (!wallet || wallet.balance < price) {
      return NextResponse.json({ error: "رصيد غير كافٍ" }, { status: 400 });
    }

    wallet.balance -= price;
    await wallet.save();

    const transaction = await Transaction.create({
      fromUserId: auth.userId,
      type: "boost",
      amount: price,
      fee: 0,
      currency: wallet.currency,
      status: "completed",
      refType: "boost",
      refId: adId,
      note: `تعزيز إعلان لمدة ${days} أيام`,
    });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + Number(days));

    const boost = await AdBoost.create({
      adId,
      userId: auth.userId,
      startDate: now,
      endDate,
      status: "active",
      paymentId: transaction._id,
    });

    return NextResponse.json({
      success: true,
      message: `تم تعزيز الإعلان لمدة ${days} أيام`,
      boost,
    });
  } catch {
    return NextResponse.json({ error: "فشل تعزيز الإعلان" }, { status: 500 });
  }
}
