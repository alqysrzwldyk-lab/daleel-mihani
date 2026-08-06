import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { getOtherUser } from "@/lib/messaging";

type LeanConversation = {
  _id: unknown;
  participants?: unknown;
  unreadCount?: unknown;
};

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

    const conversation = (await Conversation.findById(id)
      .populate("participants", "name email role avatar")
      .lean()) as LeanConversation | null;

    if (!conversation) {
      return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
    }

    const participants = (conversation.participants || []) as Array<Record<string, unknown>>;
    const isParticipant = participants.some(
      (p) => String(p._id) === String(auth.userId)
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "غير مصرح بالوصول" }, { status: 403 });
    }

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email role avatar")
      .lean();

    const otherUser = await getOtherUser(conversation, auth.userId);

    return NextResponse.json({
      success: true,
      conversationId: id,
      otherUser,
      messages,
    });
  } catch (error) {
    console.error("Messages get error:", error);
    return NextResponse.json({ error: "فشل جلب الرسائل" }, { status: 500 });
  }
}
