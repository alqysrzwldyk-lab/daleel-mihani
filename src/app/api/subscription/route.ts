import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Subscription } from "@/models/Subscription";
import { Notification } from "@/models/Notification";
import { getAppWallet } from "@/lib/appWallet";
import { atomicTransfer, InsufficientBalanceError } from "@/lib/wallet";
import { z } from "zod";
import { isRateLimited } from "@/lib/rateLimit";

const PLAN_PRICES: Record<string, number> = {
  premium: 5000,
};

const subscribeSchema = z.object({
  plan: z.enum(["premium"]),
});

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    await connectDB();
    const sub = await Subscription.findOne({
      userId: auth.userId,
      status: "active",
      endDate: { $gte: new Date() },
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      subscription: sub || { plan: "free", status: "active" },
    });
  } catch {
    return NextResponse.json({ error: "فشل جلب الاشتراك" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    if (isRateLimited(`subscribe:${auth.userId}`, { windowMs: 60000, maxRequests: 5 })) {
      return NextResponse.json({ error: "تم تجاوز الحد المسموح" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "خطة غير صالحة" },
        { status: 400 }
      );
    }

    const { plan } = parsed.data;
    const price = PLAN_PRICES[plan];

    await connectDB();

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
        type: "subscription",
        currency: "YER",
        refType: "subscription",
        note: `اشتراك ${plan === "premium" ? "بريميوم" : "مجاني"}`,
      }
    );

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    await Subscription.updateMany(
      { userId: auth.userId, status: "active" },
      { status: "expired" }
    );

    const subscription = await Subscription.create({
      userId: auth.userId,
      plan,
      startDate: now,
      endDate,
      status: "active",
      paymentId: (debitTxn as { _id: unknown })?._id,
    });

    await Notification.create({
      recipientId: auth.userId,
      title: "تم تفعيل الاشتراك",
      message: `تم تفعيل الباقة المميزة بنجاح. الرصيد المتبقي: ${debitBalance.toLocaleString()} YER`,
      type: "success",
      link: "/subscription",
    });

    return NextResponse.json({
      success: true,
      message: "تم تفعيل الاشتراك بنجاح",
      subscription,
      balance: debitBalance,
    });
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: "رصيد غير كافٍ في المحفظة" },
        { status: 400 }
      );
    }
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "فشل تفعيل الاشتراك" },
      { status: 500 }
    );
  }
}
