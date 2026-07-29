import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

export async function POST(
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

    await Message.updateMany(
      { conversationId: id, senderId: { $ne: auth.userId }, read: false },
      { read: true, readAt: new Date() }
    );

    const conv = await Conversation.findById(id);
    if (conv) {
      const unreadMap = conv.unreadCount || new Map();
      unreadMap.set(String(auth.userId), 0);
      conv.unreadCount = unreadMap;
      await conv.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث القراءة" }, { status: 500 });
  }
}
