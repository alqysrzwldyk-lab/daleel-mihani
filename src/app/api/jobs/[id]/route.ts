import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { JobApplication } from "@/models/JobApplication";
import { User } from "@/models/User";
import { getCompanyForUser } from "@/lib/company";
import { jobAdvertisementUpdateSchema, validationMessageKey } from "@/lib/validation";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// استخراج نطاق الراتب الرقمي من النص
function parseSalaryRange(salary: string | undefined): { salaryMin?: number; salaryMax?: number } {
  if (!salary) return {};
  const nums = (salary.match(/\d+/g) || []).map(Number);
  if (nums.length === 0) return {};
  if (nums.length === 1) return { salaryMin: nums[0], salaryMax: nums[0] };
  return { salaryMin: Math.min(...nums), salaryMax: Math.max(...nums) };
}

// ─── تفاصيل إعلان وظيفي عام ───
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const job = await JobAdvertisement.findById(id).lean();
    if (!job) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    // زيادة عدد المشاهدات (Fire-and-forget بدون تعطيل الاستجابة)
    JobAdvertisement.findByIdAndUpdate(id, { $inc: { views: 1 } }).catch(() => {});

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Job detail error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

// ─── تحديث إعلان وظيفي (لصاحب الشركة فقط) ───
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

    // التأكد من أن المستخدم صاحب الشركة (Employer)
    const user = await User.findById(auth.userId);
    if (!user || user.role !== "employer") {
      return NextResponse.json({ error: "حسابات الشركات فقط يمكنها تعديل الإعلانات" }, { status: 403 });
    }

    const company = await getCompanyForUser(auth.userId);
    if (!company) {
      return NextResponse.json({ error: "لا يوجد حساب شركة مرتبط" }, { status: 404 });
    }

    const job = await JobAdvertisement.findOne({ _id: id, companyId: company._id });
    if (!job) {
      return NextResponse.json({ error: "الإعلان غير موجود أو لا تملك صلاحية تعديله" }, { status: 404 });
    }

    const body = await req.json();
    const data = jobAdvertisementUpdateSchema.parse(body);

    // تحديث النطاق الرقمي للراتب عند تغييره
    const nextSalary = data.salary !== undefined ? data.salary : job.salary;
    const salaryRange = parseSalaryRange(typeof nextSalary === "string" ? nextSalary : undefined);

    Object.assign(job, data, salaryRange);
    await job.save();

    return NextResponse.json({ success: true, message: "تم تحديث الإعلان الوظيفي بنجاح", job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "validation", field: validationMessageKey(error) },
        { status: 400 }
      );
    }
    console.error("Job update error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

// ─── حذف إعلان وظيفي (لصاحب الشركة فقط) ───
export async function DELETE(
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
      return NextResponse.json({ error: "حسابات الشركات فقط يمكنها حذف الإعلانات" }, { status: 403 });
    }

    const company = await getCompanyForUser(auth.userId);
    if (!company) {
      return NextResponse.json({ error: "لا يوجد حساب شركة مرتبط" }, { status: 404 });
    }

    const job = await JobAdvertisement.findOne({ _id: id, companyId: company._id });
    if (!job) {
      return NextResponse.json({ error: "الإعلان غير موجود أو لا تملك صلاحية حذفه" }, { status: 404 });
    }

    await JobAdvertisement.findByIdAndDelete(id);
    // حذف طلبات التقديم المرتبطة بالإعلان للحفاظ على اتساق البيانات
    await JobApplication.deleteMany({ jobId: id });

    return NextResponse.json({ success: true, message: "تم حذف الإعلان الوظيفي وطلباته بنجاح" });
  } catch (error) {
    console.error("Job delete error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
