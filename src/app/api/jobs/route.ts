import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";
import { Notification } from "@/models/Notification";
import { getOrCreateCompanyForUser } from "@/lib/company";
import { jobAdvertisementSchema, validationMessageKey } from "@/lib/validation";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// استخراج نطاق الراتب الرقمي من النص (مثال: "800 - 1200")
function parseSalaryRange(salary: string): { salaryMin?: number; salaryMax?: number } {
  const nums = (salary.match(/\d+/g) || []).map(Number);
  if (nums.length === 0) return {};
  if (nums.length === 1) return { salaryMin: nums[0], salaryMax: nums[0] };
  return { salaryMin: Math.min(...nums), salaryMax: Math.max(...nums) };
}

// ─── جلب الوظائف العامة مع دعم البحث والتصفية ───
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const department = searchParams.get("department")?.trim();
    const profession = searchParams.get("profession")?.trim();
    const city = searchParams.get("city")?.trim();
    const governorate = searchParams.get("governorate")?.trim();
    const workType = searchParams.get("workType")?.trim();
    const companyName = searchParams.get("company")?.trim();
    const salaryMin = searchParams.get("salaryMin")?.trim();
    const companyId = searchParams.get("companyId")?.trim();
    const includeClosed = searchParams.get("includeClosed") === "1";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    const andConditions: Record<string, unknown>[] = [];

    if (!includeClosed) filter.status = "open";

    if (companyId) filter.companyId = companyId;
    if (department && department !== "all") filter.department = department;
    if (profession && profession !== "all") filter.department = profession;
    if (city && city !== "all") filter.city = city;
    if (governorate && governorate !== "all") filter.governorate = governorate;
    if (workType && workType !== "all") filter.workType = workType;
    if (companyName) filter.companyName = { $regex: escapeRegex(companyName), $options: "i" };

    if (q) {
      andConditions.push({
        $or: [
          { jobTitle: { $regex: escapeRegex(q), $options: "i" } },
          { description: { $regex: escapeRegex(q), $options: "i" } },
          { skills: { $regex: escapeRegex(q), $options: "i" } },
          { companyName: { $regex: escapeRegex(q), $options: "i" } },
          { department: { $regex: escapeRegex(q), $options: "i" } },
          { city: { $regex: escapeRegex(q), $options: "i" } },
        ],
      });
    }

    // فلترة الراتب: يظهر فقط الوظائف التي يكون سقف راتبها مساوياً أو أعلى من الحد المطلوب
    if (salaryMin && salaryMin !== "all") {
      const min = Number(salaryMin);
      if (!Number.isNaN(min)) {
        filter.salaryMax = { $gte: min };
      }
    }

    if (andConditions.length > 0) filter.$and = andConditions;

    const [data, total] = await Promise.all([
      JobAdvertisement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      JobAdvertisement.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Jobs list error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

// ─── إنشاء إعلان وظيفي (لأصحاب الشركات فقط) ───
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    await connectDB();

    // فقط حسابات أصحاب الشركات (Employer) يمكنها نشر إعلانات التوظيف
    const user = await User.findById(auth.userId);
    if (!user || user.role !== "employer") {
      return NextResponse.json(
        { error: "حسابات الشركات فقط هي التي يمكنها نشر إعلانات توظيف" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = jobAdvertisementSchema.parse(body);

    // إنشاء أو تحديث حساب الشركة المرتبط بالمستخدم (علاقة Companies ↔ Users)
    const company = await getOrCreateCompanyForUser(auth.userId, data.companyName, data.companyLogo);

    const salaryRange = parseSalaryRange(data.salary || "");

    const job = await JobAdvertisement.create({
      companyId: company._id,
      companyName: data.companyName.trim(),
      companyLogo: data.companyLogo || company.logo || undefined,
      jobTitle: data.jobTitle,
      jobType: data.jobType,
      department: data.department,
      description: data.description,
      skills: data.skills,
      education: data.education,
      experienceYears: data.experienceYears,
      gender: data.gender || undefined,
      ageFrom: data.ageFrom ?? undefined,
      ageTo: data.ageTo ?? undefined,
      salary: data.salary || "",
      salaryMin: salaryRange.salaryMin,
      salaryMax: salaryRange.salaryMax,
      salaryType: data.salaryType || "",
      workType: data.workType,
      city: data.city,
      governorate: data.governorate,
      country: data.country,
      vacancies: data.vacancies,
      deadline: data.deadline || undefined,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      website: data.website || undefined,
      benefits: data.benefits || "",
      banner: data.banner || undefined,
      status: data.status,
    });

    // إشعار المهنيين المناسبين تلقائياً عند نشر وظيفة جديدة
    if (job.status === "open") {
      try {
        await notifySuitableProfessionals(job);
      } catch (notifError) {
        console.error("Failed to notify professionals:", notifError);
      }
    }

    return NextResponse.json(
      { success: true, message: "تم نشر إعلانك الوظيفي بنجاح!", job },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "validation", field: validationMessageKey(error) },
        { status: 400 }
      );
    }
    console.error("Job create error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

// إشعار المهنيين الذين تتطابق مهنهم/مهاراتهم مع نص الوظيفة
async function notifySuitableProfessionals(job: {
  _id: mongoose.Types.ObjectId;
  companyName: string;
  jobTitle: string;
  jobType: string;
  department: string;
  city: string;
}) {
  const keywords = [job.department, job.jobType, job.jobTitle]
    .filter(Boolean)
    .join(" ")
    .split(/[\s،,\/]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1);

  const candidates =
    keywords.length > 0
      ? await Professional.find({
          isActive: true,
          $or: keywords.map((w) => ({
            $or: [
              { professions: { $regex: escapeRegex(w), $options: "i" } },
              { profession: { $regex: escapeRegex(w), $options: "i" } },
              { skills: { $regex: escapeRegex(w), $options: "i" } },
              { bio: { $regex: escapeRegex(w), $options: "i" } },
            ],
          })),
        })
          .select("userId")
          .limit(400)
          .lean()
      : await Professional.find({ isActive: true }).select("userId").limit(400).lean();

  if (candidates.length === 0) return;

  const jobLink = `/jobs/${job._id.toString()}`;
  const payload = candidates.map((p) => ({
    recipientId: p.userId,
    title: "💼 وظيفة جديدة تناسبك!",
    message: `نشرت شركة (${job.companyName}) إعلاناً لوظيفة: "${job.jobTitle}" في ${job.city}. اضغط لمراجعة التفاصيل والتقديم مباشرة.`,
    type: "success" as const,
    link: jobLink,
  }));

  await Notification.insertMany(payload);
}
