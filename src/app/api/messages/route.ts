import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    await connectDB();

    const conversations = await Conversation.find({
      participants: auth.userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate("participants", "name email role photo")
      .lean();

    const enriched = conversations.map((c: Record<string, unknown>) => {
      const participants = c.participants as Array<Record<string, unknown>>;
      const other = participants.find(
        (p) => String(p._id) !== String(auth.userId)
      );
      const unreadMap = (c.unreadCount as Map<string, number>) || new Map();
      return {
        _id: c._id,
        otherUser: other || null,
        lastMessage: c.lastMessage || "",
        lastMessageAt: c.lastMessageAt || c.updatedAt,
        unread: unreadMap.get(String(auth.userId)) || 0,
      };
    });

    return NextResponse.json({ success: true, conversations: enriched });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب المحادثات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { receiverId, content, refType, refId } = await request.json();
    if (!receiverId || !content) {
      return NextResponse.json({ error: "المستلم والرسالة مطلوبان" }, { status: 400 });
    }

    await connectDB();

    const participantIds = [auth.userId, receiverId].sort();
    let conversation = await Conversation.findOne({
      participants: { $all: participantIds, $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: participantIds,
        refType: refType || "professional",
        refId: refId || null,
        unreadCount: { [String(auth.userId)]: 0, [String(receiverId)]: 1 },
      });
    } else {
      const unreadMap = conversation.unreadCount || new Map();
      const current = unreadMap.get(String(receiverId)) || 0;
      unreadMap.set(String(receiverId), current + 1);
      conversation.unreadCount = unreadMap;
    }

    conversation.lastMessage = content;
    conversation.lastSenderId = auth.userId;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: auth.userId,
      content,
    });

    return NextResponse.json({
      success: true,
      message,
      conversationId: conversation._id,
    });
  } catch (error) {
    return NextResponse.json({ error: "فشل إرسال الرسالة" }, { status: 500 });
  }
}
