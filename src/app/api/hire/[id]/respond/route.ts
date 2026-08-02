import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { HireRequest } from "@/models/HireRequest";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { Message } from "@/models/Message";
import { getOrCreateConversation } from "@/lib/messaging";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const status = body?.status;
    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "قرار غير صالح" }, { status: 400 });
    }

    await connectDB();

    const hire = await HireRequest.findById(id);
    if (!hire) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (String(hire.professionalId) !== String(auth.userId)) {
      return NextResponse.json({ error: "لا يمكنك الرد على هذا الطلب" }, { status: 403 });
    }

    if (hire.status !== "pending") {
      return NextResponse.json({ error: "تم الرد على هذا الطلب مسبقاً" }, { status: 409 });
    }

    hire.status = status;
    await hire.save();

    const [professional, employer] = await Promise.all([
      User.findById(hire.professionalId).select("name"),
      User.findById(hire.employerId).select("name"),
    ]);
    const professionalName = professional?.name || "المهني";
    const employerName = employer?.name || "صاحب العمل";

    let conversationId: string | null = null;

    if (status === "accepted") {
      const conversation = await getOrCreateConversation(
        String(hire.professionalId),
        String(hire.employerId),
        "hire",
        String(hire._id)
      );

      const content = `مرحباً ${employerName}، قبلت عرض العمل "${hire.title}" من شركة ${hire.companyName} وسنبدأ التواصل الآن.`;
      const unreadMap = (conversation.unreadCount as Map<string, number>) || new Map();
      unreadMap.set(String(hire.employerId), (unreadMap.get(String(hire.employerId)) || 0) + 1);
      conversation.unreadCount = unreadMap;
      conversation.lastMessage = content;
      conversation.lastSenderId = hire.professionalId;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      await Message.create({
        conversationId: conversation._id,
        senderId: hire.professionalId,
        content,
      });

      conversationId = String(conversation._id);

      await Notification.create({
        recipientId: hire.employerId,
        title: `✅ ${professionalName} قبل عرض العمل`,
        message: `قبل المهني "${professionalName}" عرض العمل "${hire.title}" الذي أرسلته إلى ${hire.companyName}. يمكنك التواصل معه مباشرة الآن.`,
        type: "success",
        link: `/messages/${conversationId}`,
        data: {
          action: "hire",
          hireRequestId: String(hire._id),
          status: "accepted",
          senderName: professionalName,
          conversationId,
        },
      });
    } else {
      await Notification.create({
        recipientId: hire.employerId,
        title: `❌ اعتذر ${professionalName} عن العرض`,
        message: `رفض المهني "${professionalName}" عرض العمل "${hire.title}" من شركة ${hire.companyName}.`,
        type: "alert",
        link: `/hire/${hire._id}`,
        data: {
          action: "hire",
          hireRequestId: String(hire._id),
          status: "rejected",
          senderName: professionalName,
        },
      });
    }

    await Notification.updateMany(
      { "data.hireRequestId": String(hire._id) },
      { $set: { "data.status": status } }
    );

    const response = NextResponse.json({ success: true, status, conversationId });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  } catch (error) {
    console.error("Hire respond error:", error);
    return NextResponse.json({ error: "حدث خطأ ما" }, { status: 500 });
  }
}
