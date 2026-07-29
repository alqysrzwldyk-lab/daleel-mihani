import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Transaction } from "@/models/Transaction";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    await connectDB();
    const transactions = await Transaction.find({
      $or: [{ fromUserId: auth.userId }, { toUserId: auth.userId }],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب المعاملات" }, { status: 500 });
  }
}
