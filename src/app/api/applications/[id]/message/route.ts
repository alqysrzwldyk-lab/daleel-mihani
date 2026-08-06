import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { JobApplication } from "@/models/JobApplication";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { getCompanyForUser } from "@/lib/company";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ─── إرسال رسالة من الشركة إلى المتقدم ───
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const body = await req.json();
    const message = (body.message || "").toString().trim();
    if (message.length < 2) {
      return NextResponse.json({ error: "الرسالة قصيرة جداً" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(auth.userId);
    if (!user || user.role !== "employer") {
      return NextResponse.json({ error: "حسابات الشركات فقط يمكنها إرسال رسائل" }, { status: 403 });
    }

    const company = await getCompanyForUser(auth.userId);
    if (!company) {
      return NextResponse.json({ error: "لا يوجد حساب شركة مرتبط" }, { status: 404 });
    }

    const app = await JobApplication.findOne({ _id: id, companyId: company._id });
    if (!app) {
      return NextResponse.json({ error: "الطلب غير موجود أو لا تملك صلاحية مراسلة مقدمه" }, { status: 404 });
    }

    app.companyNote = message;
    await app.save();

    const job = await JobAdvertisement.findById(app.jobId)
      .select("jobTitle")
      .lean<{ jobTitle: string } | null>();

    // إشعار فوري للمتقدم بالرسالة
    await Notification.create({
      recipientId: app.professionalId,
      title: "💬 رسالة من الشركة",
      message: `أرسلت لك شركة (${company.name}) رسالة بخصوص وظيفة "${job?.jobTitle || ""}": ${message}`,
      type: "info",
      link: "/my-applications",
    });

    return NextResponse.json({ success: true, message: "تم إرسال الرسالة وإشعار المتقدم بنجاح" });
  } catch (error) {
    console.error("Application message error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
