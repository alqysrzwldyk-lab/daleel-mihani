import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { AdBoost } from "@/models/AdBoost";
import { Notification } from "@/models/Notification";
import { getAppWallet } from "@/lib/appWallet";
import { atomicTransfer, InsufficientBalanceError } from "@/lib/wallet";
import { z } from "zod";
import { isRateLimited } from "@/lib/rateLimit";

const BOOST_PRICES: Record<string, number> = {
  "3": 1000,
  "7": 2000,
  "30": 5000,
};

const boostSchema = z.object({
  adId: z.string().min(1),
  days: z.union([z.literal(3), z.literal(7), z.literal(30)]),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    if (isRateLimited(`boost:${auth.userId}`, { windowMs: 60000, maxRequests: 5 })) {
      return NextResponse.json({ error: "تم تجاوز الحد المسموح" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = boostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { adId, days } = parsed.data;
    const price = BOOST_PRICES[String(days)];

    await connectDB();

    const ad = await Ad.findById(adId);
    if (!ad) {
      return NextResponse.json(
        { error: "الإعلان غير موجود" },
        { status: 404 }
      );
    }
    if (ad.userId?.toString() !== auth.userId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية تعزيز هذا الإعلان" },
        { status: 403 }
      );
    }

    let appAdminId: string | null = null;
    try {
      const app = await getAppWallet();
      appAdminId = app.adminId;
    } catch {
      return NextResponse.json(
        { error: "System error. Please try again later." },
        { status: 500 }
      );
    }

    if (!appAdminId) {
      return NextResponse.json(
        { error: "System error. Please try again later." },
        { status: 500 }
      );
    }

    const { debitBalance, debitTxn } = await atomicTransfer(
      auth.userId,
      appAdminId,
      price,
      {
        type: "boost",
        currency: "YER",
        refType: "boost",
        refId: adId,
        note: `تعزيز إعلان لمدة ${days} أيام`,
      }
    );

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + Number(days));

    const boost = await AdBoost.create({
      adId,
      userId: auth.userId,
      startDate: now,
      endDate,
      status: "active",
      paymentId: (debitTxn as { _id: unknown })?._id,
    });

    await Notification.create({
      recipientId: auth.userId,
      title: "تم تعزيز الإعلان",
      message: `تم تعزيز إعلانك لمدة ${days} أيام بنجاح. الرصيد المتبقي: ${debitBalance.toLocaleString()} YER`,
      type: "success",
      link: "/dashboard/my-ads",
    });

    return NextResponse.json({
      success: true,
      message: `تم تعزيز الإعلان لمدة ${days} أيام`,
      boost,
      balance: debitBalance,
    });
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: "رصيد غير كافٍ" },
        { status: 400 }
      );
    }
    console.error("Boost error:", error);
    return NextResponse.json(
      { error: "فشل تعزيز الإعلان" },
      { status: 500 }
    );
  }
}
