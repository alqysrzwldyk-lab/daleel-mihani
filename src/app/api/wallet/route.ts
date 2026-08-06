import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Wallet } from "@/models/Wallet";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    await connectDB();
    let wallet = await Wallet.findOne({ userId: auth.userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId: auth.userId, balance: 0 });
    }

    return NextResponse.json({ success: true, wallet });
  } catch {
    return NextResponse.json({ error: "فشل جلب المحفظة" }, { status: 500 });
  }
}
