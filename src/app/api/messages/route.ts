import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Conversation } from "@/models/Conversation";
import { User } from "@/models/User";
import {
  createMessageAndNotify,
  getOtherUser,
  getConversationUnread,
} from "@/lib/messaging";

type LeanConversation = {
  _id: unknown;
  participants?: unknown;
  lastMessage?: string;
  lastMessageAt?: unknown;
  updatedAt?: unknown;
  refType?: string | null;
  refId?: unknown;
};

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
      .populate("participants", "name email role avatar")
      .lean<LeanConversation[]>();

    const enriched = await Promise.all(
      conversations.map(async (c: LeanConversation) => {
        const other = await getOtherUser(c, auth.userId!);
        const unread = await getConversationUnread(c, auth.userId!);
        return {
          _id: c._id,
          otherUser: other,
          lastMessage: c.lastMessage || "",
          lastMessageAt: c.lastMessageAt || c.updatedAt,
          unread,
          refType: c.refType || null,
          refId: c.refId || null,
        };
      })
    );

    return NextResponse.json({ success: true, conversations: enriched });
  } catch (error) {
    console.error("Messages list error:", error);
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

    if (String(receiverId) === String(auth.userId)) {
      return NextResponse.json({ error: "لا يمكنك مراسلة نفسك" }, { status: 400 });
    }

    await connectDB();

    const receiver = await User.findById(receiverId).select("_id");
    if (!receiver) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const { message, conversation } = await createMessageAndNotify({
      senderId: auth.userId,
      receiverId,
      content: content.slice(0, 2000),
      refType,
      refId,
    });

    return NextResponse.json({
      success: true,
      message,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "فشل إرسال الرسالة" }, { status: 500 });
  }
}
