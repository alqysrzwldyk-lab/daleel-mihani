import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { JobApplication, IJobApplication } from "@/models/JobApplication";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { getCompanyForUser } from "@/lib/company";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ─── تفاصيل طلب توظيف (لصاحب الشركة أو المهني صاحب الطلب) ───
export async function GET(
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

    await connectDB();
    const app = await JobApplication.findById(id).lean<IJobApplication | null>();

    if (!app) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const user = await User.findById(auth.userId);

    // صلاحية الوصول: صاحب الشركة أو المهني صاحب الطلب فقط
    if (user?.role === "employer") {
      const company = await getCompanyForUser(auth.userId);
      if (!company || String(company._id) !== String(app.companyId)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    } else {
      if (String(app.professionalId) !== auth.userId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    const job = await JobAdvertisement.findById(app.jobId)
      .select("jobTitle companyName companyLogo salary city workType")
      .lean<{ jobTitle: string; companyName?: string; companyLogo?: string; salary?: string; city?: string; workType?: string } | null>();

    return NextResponse.json({
      success: true,
      application: { ...app, jobId: String(app.jobId), job: job ?? null },
    });
  } catch (error) {
    console.error("Application detail error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

// ─── تغيير حالة الطلب (لصاحب الشركة فقط): pending / accepted / rejected ───
export async function PUT(
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

    await connectDB();

    const user = await User.findById(auth.userId);
    if (!user || user.role !== "employer") {
      return NextResponse.json({ error: "حسابات الشركات فقط يمكنها تغيير حالة الطلبات" }, { status: 403 });
    }

    const company = await getCompanyForUser(auth.userId);
    if (!company) {
      return NextResponse.json({ error: "لا يوجد حساب شركة مرتبط" }, { status: 404 });
    }

    const app = await JobApplication.findOne({ _id: id, companyId: company._id });
    if (!app) {
      return NextResponse.json({ error: "الطلب غير موجود أو لا تملك صلاحية تعديله" }, { status: 404 });
    }

    const { status, note } = await req.json();
    if (!["pending", "accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "حالة الطلب غير صالحة" }, { status: 400 });
    }

    app.status = status;
    if (typeof note === "string" && note.trim()) app.companyNote = note.trim();
    await app.save();

    // إشعار المهني المتقدم بنتيجة طلبه
    const job = await JobAdvertisement.findById(app.jobId)
      .select("jobTitle")
      .lean<{ jobTitle: string } | null>();
    const statusTitle =
      status === "accepted"
        ? "🎉 تم قبول طلبك!"
        : status === "rejected"
        ? "❌ تم رفض طلبك"
        : "🔄 تم تحديث حالة طلبك";

    const statusMessage =
      status === "accepted"
        ? `تهانينا! تم قبول طلبك على وظيفة "${job?.jobTitle || ""}". سيتواصل معك صاحب الشركة قريباً.`
        : status === "rejected"
        ? `نأسف لإعلامك أن طلبك على وظيفة "${job?.jobTitle || ""}" لم يتم قبوله. نتمنى لك التوفيق في فرص قادمة.`
        : `تم تحديث حالة طلبك على وظيفة "${job?.jobTitle || ""}" إلى قيد المراجعة.`;

    await Notification.create({
      recipientId: app.professionalId,
      title: statusTitle,
      message: statusMessage,
      type: status === "accepted" ? "success" : status === "rejected" ? "alert" : "info",
      link: "/my-applications",
    });

    return NextResponse.json({ success: true, message: "تم تحديث حالة الطلب بنجاح", application: app });
  } catch (error) {
    console.error("Application update error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
