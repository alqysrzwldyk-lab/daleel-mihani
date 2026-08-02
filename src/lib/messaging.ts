import { connectDB } from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { Notification } from "@/models/Notification";
import mongoose from "mongoose";

export async function getOrCreateConversation(
  userA: string,
  userB: string,
  refType?: string,
  refId?: string
) {
  await connectDB();

  const a = new mongoose.Types.ObjectId(userA);
  const b = new mongoose.Types.ObjectId(userB);

  let conversation = await Conversation.findOne({
    participants: { $all: [a, b], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [a, b],
      refType: refType || null,
      refId: refId ? new mongoose.Types.ObjectId(refId) : null,
      unreadCount: new Map([[String(a), 0], [String(b), 0]]),
    });
  }

  return conversation;
}

export async function createMessageAndNotify(opts: {
  senderId: string;
  receiverId: string;
  content: string;
  refType?: string;
  refId?: string;
}) {
  await connectDB();

  const conversation = await getOrCreateConversation(
    opts.senderId,
    opts.receiverId,
    opts.refType,
    opts.refId
  );

  const unreadMap = (conversation.unreadCount as Map<string, number>) || new Map();
  const current = unreadMap.get(String(opts.receiverId)) || 0;
  unreadMap.set(String(opts.receiverId), current + 1);
  conversation.unreadCount = unreadMap;
  conversation.lastMessage = opts.content;
  conversation.lastSenderId = new mongoose.Types.ObjectId(opts.senderId);
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: opts.senderId,
    content: opts.content,
  });

  try {
    await Notification.create({
      recipientId: opts.receiverId,
      type: "info",
      title: "رسالة جديدة",
      message: opts.content.slice(0, 100),
      link: `/messages/${conversation._id}`,
    });
  } catch {}

  return { message, conversation };
}

export async function getOtherUser(conversation: any, myUserId: string) {
  const participants = Array.isArray(conversation.participants)
    ? conversation.participants
    : [];
  const other = participants.find(
    (p: any) => String(p?._id ?? p) !== String(myUserId)
  );

  if (!other || typeof other !== "object" || !other.name) {
    return {
      _id: String(other?._id ?? other ?? ""),
      name: "مستخدم",
      email: "",
      role: "user",
      avatar: null,
    };
  }

  return {
    _id: String(other._id),
    name: other.name,
    email: other.email || "",
    role: other.role || "user",
    avatar: other.avatar || null,
  };
}

export async function getConversationUnread(
  conversation: any,
  userId: string
): Promise<number> {
  const u = conversation?.unreadCount || {};
  const value =
    typeof u.get === "function" ? u.get(String(userId)) : u[String(userId)];
  return typeof value === "number" ? value : 0;
}
