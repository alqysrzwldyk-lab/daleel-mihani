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

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
    }

    const participants = (conversation.participants || []) as unknown[];
    const isParticipant = participants.some(
      (p) => String(p) === String(auth.userId)
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "غير مصرح بالوصول" }, { status: 403 });
    }

    await Message.updateMany(
      { conversationId: id, senderId: { $ne: auth.userId }, read: false },
      { read: true, readAt: new Date() }
    );

    const unreadMap = (conversation.unreadCount as Map<string, number>) || new Map();
    unreadMap.set(String(auth.userId), 0);
    conversation.unreadCount = unreadMap;
    await conversation.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "فشل تحديث القراءة" }, { status: 500 });
  }
}
