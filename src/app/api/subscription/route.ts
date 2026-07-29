import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Subscription } from "@/models/Subscription";
import { Wallet } from "@/models/Wallet";
import { Transaction } from "@/models/Transaction";

const PLAN_PRICES: Record<string, number> = {
  premium: 5000,
};

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
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب الاشتراك" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { plan } = await request.json();
    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "خطة غير صالحة" }, { status: 400 });
    }

    await connectDB();
    const price = PLAN_PRICES[plan];

    let wallet = await Wallet.findOne({ userId: auth.userId });
    if (!wallet || wallet.balance < price) {
      return NextResponse.json({ error: "رصيد غير كافٍ في المحفظة" }, { status: 400 });
    }

    wallet.balance -= price;
    await wallet.save();

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const transaction = await Transaction.create({
      fromUserId: auth.userId,
      type: "subscription",
      amount: price,
      fee: 0,
      currency: wallet.currency,
      status: "completed",
      refType: "subscription",
      note: `اشتراك ${plan === "premium" ? "بريميوم" : "مجاني"}`,
    });

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
      paymentId: transaction._id,
    });

    return NextResponse.json({
      success: true,
      message: "تم تفعيل الاشتراك بنجاح",
      subscription,
    });
  } catch (error) {
    return NextResponse.json({ error: "فشل تفعيل الاشتراك" }, { status: 500 });
  }
}
