import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Company, type ICompany } from "@/models/Company";
import { CompanyRating } from "@/models/CompanyRating";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { JobApplication } from "@/models/JobApplication";
import { User } from "@/models/User";
import type {
  CompanyProfileData,
  CompanyPublic,
  CompanyReview,
  SimilarCompany,
} from "@/lib/companyTypes";

export const dynamic = "force-dynamic";

const RATINGS_LIMIT = 6;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    await connectDB();

    const company = await Company.findById(id).lean<ICompany | null>();
    if (!company) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const auth = await getAuthFromCookies();
    const isOwner = !!auth?.userId && String(company.userId) === String(auth.userId);

    // زيادة عدد المشاهدات (باستثناء صاحب الشركة نفسه)
    if (!isOwner) {
      await Company.updateOne({ _id: company._id }, { $inc: { views: 1 } });
    }

    const companyId = company._id as unknown as mongoose.Types.ObjectId;

    // ─── إحصائيات الشركة ───
    const [jobsCount, applicationsCount, hiredCount] = await Promise.all([
      JobAdvertisement.countDocuments({ companyId, status: "open" }),
      JobApplication.countDocuments({ companyId }),
      JobApplication.countDocuments({ companyId, status: "accepted" }),
    ]);

    // ─── التقييمات والإحصائيات ───
    const [ratingAgg, ratingDist, latestRatings] = await Promise.all([
      CompanyRating.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            average: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]),
      CompanyRating.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
      CompanyRating.find({ companyId })
        .sort({ createdAt: -1 })
        .limit(RATINGS_LIMIT)
        .select("reviewerId rating comment createdAt")
        .lean(),
    ]);

    const averageRating = Math.round((ratingAgg[0]?.average || 0) * 10) / 10;
    const reviewsCount = ratingAgg[0]?.count || 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of ratingDist) {
      ratingDistribution[d._id] = d.count;
    }

    const reviewerIds = latestRatings.map((r) => r.reviewerId);
    const reviewerNames: Record<string, string> = {};
    if (reviewerIds.length > 0) {
      const users = await User.find({ _id: { $in: reviewerIds } })
        .select("name")
        .lean();
      for (const u of users) {
        reviewerNames[String(u._id)] = u.name || "مستخدم";
      }
    }

    const reviews: CompanyReview[] = latestRatings.map((r) => ({
      _id: String(r._id),
      reviewerName: reviewerNames[String(r.reviewerId)] || "مستخدم",
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));

    // تقييم المستخدم الحالي (إن وجد)
    let userRating: number | undefined;
    if (auth?.userId) {
      const mine = await CompanyRating.findOne({ companyId, reviewerId: auth.userId });
      if (mine) userRating = mine.rating;
    }

    // ─── شركات مشابهة (نفس القطاع أو المدينة) ───
    const similarCompanies = await findSimilarCompanies(company, companyId);

    // ─── الوظائف المفتوحة ───
    const openJobs = await JobAdvertisement.find({ companyId, status: "open" })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const profile: CompanyProfileData = {
      company: toPublicCompany(company),
      jobs: openJobs.map((j: any) => ({
        _id: String(j._id),
        companyId: String(j.companyId),
        companyName: j.companyName,
        companyLogo: j.companyLogo,
        jobTitle: j.jobTitle,
        jobType: j.jobType,
        department: j.department,
        description: j.description,
        skills: j.skills || [],
        education: j.education,
        experienceYears: j.experienceYears,
        gender: j.gender,
        ageFrom: j.ageFrom,
        ageTo: j.ageTo,
        salary: j.salary,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryType: j.salaryType,
        workType: j.workType,
        city: j.city,
        governorate: j.governorate,
        country: j.country,
        vacancies: j.vacancies,
        deadline: j.deadline,
        contactPhone: j.contactPhone,
        contactEmail: j.contactEmail,
        website: j.website,
        benefits: j.benefits,
        banner: j.banner,
        status: j.status,
        views: j.views,
        applicationsCount: j.applicationsCount,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
      })),
      stats: {
        jobsCount,
        applicationsCount,
        views: (company.views || 0) + (isOwner ? 0 : 1),
        hiredCount,
        averageRating,
        reviewsCount,
      },
      reviews,
      userRating,
      isOwner,
      ratingDistribution,
      similarCompanies,
    };

    return NextResponse.json({ success: true, ...profile });
  } catch (error) {
    console.error("Company profile error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

function toPublicCompany(c: any): CompanyPublic {
  return {
    _id: String(c._id),
    userId: String(c.userId),
    name: c.name,
    logo: c.logo,
    description: c.description,
    industry: c.industry,
    website: c.website,
    email: c.email,
    phone: c.phone,
    city: c.city,
    cover: c.cover,
    tagline: c.tagline,
    mission: c.mission,
    vision: c.vision,
    values: c.values || [],
    specializations: c.specializations || [],
    businessActivities: c.businessActivities || [],
    services: c.services || [],
    foundedYear: c.foundedYear,
    employeesCount: c.employeesCount,
    companySize: c.companySize,
    address: c.address,
    country: c.country,
    workingHours: c.workingHours,
    gallery: c.gallery || [],
    latitude: c.latitude,
    longitude: c.longitude,
    social: c.social || {},
    views: c.views || 0,
    createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
  };
}

async function findSimilarCompanies(
  company: any,
  companyId: mongoose.Types.ObjectId
): Promise<SimilarCompany[]> {
  const candidates: any[] = [];

  if (company.industry) {
    candidates.push(await Company.find({ _id: { $ne: companyId }, industry: company.industry })
      .select("name logo industry city country")
      .limit(12)
      .lean());
  }

  if (company.city && company.city !== company.industry) {
    candidates.push(await Company.find({ _id: { $ne: companyId }, city: company.city })
      .select("name logo industry city country")
      .limit(12)
      .lean());
  }

  const seen = new Set<string>();
  const merged: any[] = [];
  for (const list of candidates) {
    for (const c of list) {
      const key = String(c._id);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(c);
        if (merged.length >= 12) break;
      }
    }
    if (merged.length >= 12) break;
  }

  if (merged.length === 0) return [];

  const ids = merged.map((c) => c._id as mongoose.Types.ObjectId);

  const [ratingAgg, jobCounts] = await Promise.all([
    CompanyRating.aggregate([
      { $match: { companyId: { $in: ids } } },
      {
        $group: {
          _id: "$companyId",
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]),
    JobAdvertisement.aggregate([
      { $match: { companyId: { $in: ids }, status: "open" } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]),
  ]);

  const ratingMap = new Map(ratingAgg.map((r) => [String(r._id), r]));
  const jobsMap = new Map(jobCounts.map((j) => [String(j._id), j.count]));

  return merged.map((c) => {
    const stats = ratingMap.get(String(c._id));
    return {
      _id: String(c._id),
      name: c.name,
      logo: c.logo,
      industry: c.industry,
      city: c.city,
      country: c.country,
      averageRating: stats ? Math.round(stats.average * 10) / 10 : 0,
      reviewsCount: stats?.count || 0,
      openJobs: jobsMap.get(String(c._id)) || 0,
    };
  });
}
