import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Notification } from "@/models/Notification";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── تعليم جميع إشعارات المستخدم كمقروءة (سلوك مشابه لتطبيقات المحادثة) ───
export async function POST() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    await connectDB();

    const currentUserIdStr = auth.userId.toString().trim();
    const currentUserIdObj = new mongoose.Types.ObjectId(currentUserIdStr);

    const result = await Notification.updateMany(
      {
        $or: [{ recipientId: currentUserIdObj }, { recipientId: currentUserIdStr }],
        isRead: false,
      },
      { isRead: true }
    );

    return NextResponse.json({ success: true, updated: result.modifiedCount, unreadCount: 0 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ ما";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
