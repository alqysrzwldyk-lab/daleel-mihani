import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { JobApplication } from "@/models/JobApplication";
import { Company } from "@/models/Company";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { jobApplicationSchema, validationMessageKey } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ─── تقديم طلب توظيف من مهني ───
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // حماية ضد إغراق طلبات التقديم: 10 طلبات كحد أقصى في الدقيقة لكل IP
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (isRateLimited(ip, { windowMs: 60 * 1000, maxRequests: 10 })) {
      return NextResponse.json({ error: "طلبات كثيرة جداً. يرجى المحاولة بعد قليل." }, { status: 429 });
    }

    const auth = getAuthFromRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    await connectDB();

    // فقط حسابات المهنيين (Professional) يمكنها التقديم على الوظائف
    const user = await User.findById(auth.userId);
    if (!user || user.role !== "professional") {
      return NextResponse.json({ error: "حسابات المهنيين فقط يمكنها التقديم على الوظائف" }, { status: 403 });
    }

    const job = await JobAdvertisement.findById(id);
    if (!job) {
      return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
    }
    if (job.status !== "open") {
      return NextResponse.json({ error: "هذا الإعلان الوظيفي مغلق حالياً" }, { status: 400 });
    }
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return NextResponse.json({ error: "انتهى آخر موعد للتقديم على هذه الوظيفة" }, { status: 400 });
    }

    // منع التقديم المكرر على نفس الوظيفة
    const existing = await JobApplication.findOne({
      jobId: job._id,
      professionalId: auth.userId,
    });
    if (existing) {
      return NextResponse.json({ error: "لقد تقدمت لهذه الوظيفة مسبقاً" }, { status: 409 });
    }

    const body = await req.json();
    const data = jobApplicationSchema.parse(body);

    const application = await JobApplication.create({
      jobId: job._id,
      companyId: job.companyId,
      professionalId: new mongoose.Types.ObjectId(auth.userId),
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      profession: data.profession,
      education: data.education,
      experience: data.experience,
      coverLetter: data.coverLetter,
      cvFile: data.cvFile,
      photo: data.photo || undefined,
      status: "pending",
    });

    // تحديث عدد المتقدمين في الإعلان
    await JobAdvertisement.findByIdAndUpdate(job._id, { $inc: { applicationsCount: 1 } });

    // إشعار صاحب الشركة بوصول طلب جديد
    try {
      const company = await Company.findById(job.companyId);
      if (company) {
        await Notification.create({
          recipientId: company.userId,
          title: "📥 طلب توظيف جديد وصل!",
          message: `تقدّم ${data.fullName} على وظيفة "${job.jobTitle}" بوصفه ${data.profession}. راجع لوحة الطلبات للاطلاع على السيرة الذاتية واتخاذ القرار.`,
          type: "info",
          link: "/dashboard/applications",
        });
      }
    } catch (notifError) {
      console.error("Failed to notify company:", notifError);
    }

    return NextResponse.json(
      { success: true, message: "تم إرسال طلبك بنجاح! سيقوم صاحب الشركة بمراجعته قريباً.", application },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "validation", field: validationMessageKey(error) },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "لقد تقدمت لهذه الوظيفة مسبقاً" }, { status: 409 });
    }
    console.error("Job apply error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
