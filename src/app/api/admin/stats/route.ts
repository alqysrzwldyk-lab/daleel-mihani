import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";
import { Company } from "@/models/Company";
import { Ad } from "@/models/Ad";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { JobApplication } from "@/models/JobApplication";
import { Transaction } from "@/models/Transaction";
import { Subscription } from "@/models/Subscription";
import { AdReport } from "@/models/AdReport";
import { UserReport } from "@/models/UserReport";
import { Rating } from "@/models/Rating";
import { CompanyRating } from "@/models/CompanyRating";
import { AdminAuditLog } from "@/models/AdminAuditLog";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const todayStart = startOfToday();
    const [
      totalUsers,
      professionals,
      companies,
      ads,
      jobs,
      applications,
      transactions,
      activeSubscriptions,
      pendingAdReports,
      pendingUserReports,
      newUsersToday,
      newUsersThisWeek,
      openJobs,
      unverifiedCompanies,
      unverifiedProfessionals,
      unverifiedAds,
      [todayNew, yesterdayNew],
      recentLogs,
    ] = await Promise.all([
      User.countDocuments(),
      Professional.countDocuments(),
      Company.countDocuments(),
      Ad.countDocuments(),
      JobAdvertisement.countDocuments(),
      JobApplication.countDocuments(),
      Transaction.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      AdReport.countDocuments({ status: "pending" }),
      UserReport.countDocuments({ status: "pending" }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: daysAgo(6) } }),
      JobAdvertisement.countDocuments({ status: "open" }),
      Company.countDocuments({ verified: false }),
      Professional.countDocuments({ verified: false }),
      Ad.countDocuments({ verified: false }),
      Promise.all([
        User.countDocuments({ createdAt: { $gte: todayStart } }),
        User.countDocuments({ createdAt: { $gte: daysAgo(1), $lt: todayStart } }),
      ]),
      AdminAuditLog.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select("adminEmail action resource resourceId createdAt")
        .lean(),
    ]);

    const commissionAgg = await Transaction.aggregate([
      { $match: { type: "commission", status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const [recentUsers, rawRecentReports, totalRatings] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(6).select("name email role createdAt").lean(),
      AdReport.find({ status: "pending" }).sort({ createdAt: -1 }).limit(5).lean(),
      Promise.all([Rating.countDocuments(), CompanyRating.countDocuments()]),
    ]);
    const recentReports = (rawRecentReports as unknown as {
      _id: string;
      reason: string;
      createdAt: Date;
    }[]).map((r) => ({
      id: String(r._id),
      reason: r.reason,
      createdAt: r.createdAt,
    }));

    const growthRate =
      yesterdayNew === 0 ? (todayNew > 0 ? 100 : 0) : Math.round(((todayNew - yesterdayNew) / yesterdayNew) * 100);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProfessionals: professionals,
        totalCompanies: companies,
        totalAds: ads,
        totalJobs: jobs,
        totalApplications: applications,
        totalTransactions: transactions,
        activeSubscriptions,
        pendingAdReports,
        pendingUserReports,
        totalCommissions: commissionAgg[0]?.total ?? 0,
        newUsersToday,
        newUsersThisWeek,
        growthRate,
        openJobs,
        totalRatings: totalRatings[0] + totalRatings[1],
      },
      alerts: {
        pendingReports: pendingAdReports + pendingUserReports,
        unverifiedCompanies,
        unverifiedProfessionals,
        unverifiedAds,
        openJobs,
      },
      recentActivity: (recentLogs as unknown as {
        _id: string;
        adminEmail: string;
        action: string;
        resource: string;
        resourceId?: string;
        createdAt: Date;
      }[]).map((l) => ({
        id: String(l._id),
        adminEmail: l.adminEmail,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        createdAt: l.createdAt,
      })),
      recentUsers,
      recentReports,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
