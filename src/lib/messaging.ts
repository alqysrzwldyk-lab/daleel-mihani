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

type ParticipantLike = {
  _id?: mongoose.Types.ObjectId | string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
};

type ConversationLike = {
  participants?: unknown;
  unreadCount?: unknown;
};

function asParticipantList(conversation: ConversationLike): ParticipantLike[] {
  if (!Array.isArray(conversation.participants)) return [];
  return conversation.participants
    .map((p) => {
      if (typeof p === "object" && p !== null) return p as ParticipantLike;
      return { _id: p as mongoose.Types.ObjectId | string };
    })
    .filter((p) => typeof p._id !== "undefined");
}

export async function getOtherUser(conversation: ConversationLike, myUserId: string) {
  const participants = asParticipantList(conversation);
  const other = participants.find((p) => String(p._id) !== String(myUserId));

  if (!other || !other.name) {
    return {
      _id: other ? String(other._id) : "",
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
  conversation: ConversationLike,
  userId: string
): Promise<number> {
  const u = conversation.unreadCount || {};
  const value =
    typeof u === "object" && u !== null && typeof (u as { get?: unknown }).get === "function"
      ? (u as { get(key: string): number | undefined }).get(String(userId))
      : (u as Record<string, number>)[String(userId)];
  return typeof value === "number" ? value : 0;
}
