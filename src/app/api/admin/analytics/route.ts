import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";
import { Company } from "@/models/Company";
import { Ad } from "@/models/Ad";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { Transaction } from "@/models/Transaction";
import { AdReport } from "@/models/AdReport";
import { UserReport } from "@/models/UserReport";
import { AdminAuditLog } from "@/models/AdminAuditLog";
import type { Model } from "mongoose";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function groupByDay(Model: Model<unknown>, days: number): Promise<{ date: string; count: number }[]> {
  const rows = await Model.aggregate([
    { $match: { createdAt: { $gte: daysAgo(days - 1) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ date: r._id, count: r.count }));
}

function fillMissing(rows: { date: string; count: number }[], days: number) {
  const map = new Map(rows.map((r) => [r.date, r.count]));
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: map.get(key) ?? 0 });
  }
  return out;
}

function growthPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const days = Math.min(365, Math.max(7, parseInt(req.nextUrl.searchParams.get("days") || "14", 10) || 14));

  try {
    await connectDB();
    const [userByDay, adsByDay, jobsByDay, roleDist, adStatusDist, topCategories, txnsByDay] =
      await Promise.all([
        groupByDay(User, days),
        groupByDay(Ad, days),
        groupByDay(JobAdvertisement, days),
        User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Ad.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Ad.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        groupByDay(Transaction, days),
      ]);

    const [totalUsers, totalAds, totalJobs, totalCompanies, totalProfessionals] = await Promise.all([
      User.countDocuments(),
      Ad.countDocuments(),
      JobAdvertisement.countDocuments(),
      Company.countDocuments(),
      Professional.countDocuments(),
    ]);

    const [adReportsDist, userReportsDist, jobsDist, adminActivity, userGrowth] = await Promise.all([
      AdReport.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      UserReport.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      JobAdvertisement.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      AdminAuditLog.countDocuments({ createdAt: { $gte: daysAgo(days - 1) } }),
      Promise.all([
        User.countDocuments({ createdAt: { $gte: daysAgo(6) } }),
        User.countDocuments({ createdAt: { $gte: daysAgo(13), $lt: daysAgo(6) } }),
        User.countDocuments({ createdAt: { $gte: daysAgo(29) } }),
        User.countDocuments({ createdAt: { $gte: daysAgo(59), $lt: daysAgo(29) } }),
      ]),
    ]);

    const totalViews = (await Ad.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]))[0]?.total ?? 0;

    return NextResponse.json({
      days,
      series: {
        users: fillMissing(userByDay, days),
        ads: fillMissing(adsByDay, days),
        jobs: fillMissing(jobsByDay, days),
        transactions: fillMissing(txnsByDay, days),
      },
      roleDistribution: roleDist.map((r) => ({ role: r._id, count: r.count })),
      adStatusDistribution: adStatusDist.map((r) => ({ status: r._id, count: r.count })),
      topCategories: topCategories.map((c) => ({ category: c._id, count: c.count })),
      reportStatusDistribution: {
        ad: adReportsDist.map((r) => ({ status: r._id, count: r.count })),
        user: userReportsDist.map((r) => ({ status: r._id, count: r.count })),
      },
      jobStatusDistribution: jobsDist.map((r) => ({ status: r._id, count: r.count })),
      totals: {
        users: totalUsers,
        ads: totalAds,
        jobs: totalJobs,
        companies: totalCompanies,
        professionals: totalProfessionals,
        totalViews,
      },
      growth: {
        usersWeek: growthPercent(userGrowth[0], userGrowth[1]),
        usersMonth: growthPercent(userGrowth[2], userGrowth[3]),
        adminActivity,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
