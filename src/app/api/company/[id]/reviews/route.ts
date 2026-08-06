import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Company } from "@/models/Company";
import { CompanyRating } from "@/models/CompanyRating";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";

export const dynamic = "force-dynamic";

const schema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول لتقييم الشركة" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const body = await req.json();
    const data = schema.parse(body);

    await connectDB();

    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    // لا يسمح لصاحب الشركة بتقييم شركته
    if (String(company.userId) === String(auth.userId)) {
      return NextResponse.json({ error: "لا يمكنك تقييم شركتك الخاصة" }, { status: 403 });
    }

    const existing = await CompanyRating.findOne({
      companyId: company._id,
      reviewerId: auth.userId,
    });

    if (existing) {
      return NextResponse.json({ error: "alreadyRated" }, { status: 409 });
    }

    const rating = await CompanyRating.create({
      companyId: company._id,
      reviewerId: auth.userId,
      rating: data.rating,
      comment: data.comment,
    });

    const [stats, distribution] = await Promise.all([
      CompanyRating.aggregate([
        { $match: { companyId: company._id } },
        {
          $group: {
            _id: null,
            average: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]),
      CompanyRating.aggregate([
        { $match: { companyId: company._id } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      ratingDistribution[d._id] = d.count;
    }

    const reviewer = await User.findById(auth.userId).select("name").lean<{ name?: string } | null>();

    // إشعار صاحب الشركة بالتقييم الجديد
    try {
      await Notification.create({
        recipientId: company.userId,
        title: `⭐ تقييم جديد لشركة (${company.name})`,
        message: `حصلت شركتك على تقييم ${data.rating} من 5${data.comment ? ` مع تعليق: "${data.comment}"` : ""}.`,
        type: "info",
        link: `/company/${company._id}`,
        data: { action: "company_rating", senderName: reviewer?.name || "", score: data.rating },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      rating: {
        _id: String(rating._id),
        reviewerName: reviewer?.name || "مستخدم",
        rating: rating.rating,
        comment: rating.comment,
        createdAt: rating.createdAt.toISOString(),
      },
      averageRating: Math.round((stats[0]?.average || 0) * 10) / 10,
      reviewsCount: stats[0]?.count || 0,
      ratingDistribution,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    console.error("Company rating error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
