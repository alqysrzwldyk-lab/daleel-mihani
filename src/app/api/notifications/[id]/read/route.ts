import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Notification } from "@/models/Notification";
import mongoose from "mongoose";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        recipientId: auth.userId,
      },
      { isRead: true }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطأ في تحديث الإشعار" }, { status: 500 });
  }
}
