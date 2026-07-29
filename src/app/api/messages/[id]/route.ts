import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Message } from "@/models/Message";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email role")
      .lean();

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب الرسائل" }, { status: 500 });
  }
}
