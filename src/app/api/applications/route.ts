import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { JobApplication, IJobApplication } from "@/models/JobApplication";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { User } from "@/models/User";
import { getCompanyForUser } from "@/lib/company";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ─── جلب طلبات التوظيف ───
// - صاحب الشركة: يرى طلبات وظائفه
// - المهني: يرى طلباته التي قدّمها
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId")?.trim();
    const status = searchParams.get("status")?.trim();

    const filter: Record<string, unknown> = {};

    if (user.role === "employer") {
      // الشركة ترى فقط الطلبات الواردة على وظائفها
      const company = await getCompanyForUser(auth.userId);
      if (!company) {
        return NextResponse.json({ success: true, data: [], total: 0 });
      }
      filter.companyId = company._id;
    } else {
      // المهني يرى طلباته التي قدّمها
      filter.professionalId = auth.userId;
    }

    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) filter.jobId = jobId;
    if (status && ["pending", "accepted", "rejected"].includes(status)) filter.status = status;

    const [data, total] = await Promise.all([
      JobApplication.find(filter).sort({ createdAt: -1 }).lean<IJobApplication[]>(),
      JobApplication.countDocuments(filter),
    ]);

    // دمج معلومات الوظيفة (العنوان / اسم الشركة) مع كل طلب
    type JobBrief = { _id: string; jobTitle: string; companyName?: string; companyLogo?: string };
    const jobIds = data.map((app) => String(app.jobId)).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const jobsMap = new Map<string, JobBrief>();
    if (jobIds.length > 0) {
      const found = await JobAdvertisement.find({ _id: { $in: jobIds } })
        .select("jobTitle companyName companyLogo")
        .lean<JobBrief[]>();
      for (const j of found) jobsMap.set(String(j._id), j);
    }

    const mapped = data.map((app) => {
      const jobIdStr = String(app.jobId);
      const joined = jobsMap.get(jobIdStr);
      return {
        _id: String(app._id),
        jobId: jobIdStr,
        jobTitle: joined?.jobTitle || "",
        companyName: joined?.companyName || "",
        companyLogo: joined?.companyLogo || "",
        companyId: String(app.companyId),
        professionalId: String(app.professionalId),
        fullName: app.fullName,
        phone: app.phone,
        email: app.email,
        profession: app.profession,
        education: app.education,
        experience: app.experience,
        coverLetter: app.coverLetter,
        cvFile: app.cvFile,
        photo: app.photo,
        status: app.status,
        companyNote: app.companyNote,
        createdAt: app.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: mapped, total });
  } catch (error) {
    console.error("Applications list error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
