import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Rating, type IRating } from "@/models/Rating";
import { CompanyRating, type ICompanyRating } from "@/models/CompanyRating";
import { Professional } from "@/models/Professional";
import { Company } from "@/models/Company";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") === "company" ? "company" : "professional";
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  const filter: Record<string, unknown> = {};
  if (q) filter.comment = { $regex: q, $options: "i" };

  try {
    await connectDB();
    const Model = type === "company" ? CompanyRating : Rating;
    const [total, ratings, users, targets] = await Promise.all([
      Model.countDocuments(filter),
      Model.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.find({}).select("_id name email").lean(),
      type === "company"
        ? Company.find({}).select("_id name").lean()
        : Professional.find({}).select("_id name").lean(),
    ]);

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const targetMap = new Map(targets.map((t) => [String(t._id), (t as unknown as { name: string }).name]));

    const isCompany = type === "company";

    const enriched = ratings.map((r) => {
      let targetId: string;
      let reviewerId: string;
      let score: number;

      if (isCompany) {
        const cr = r as unknown as ICompanyRating;
        targetId = String(cr.companyId);
        reviewerId = String(cr.reviewerId);
        score = cr.rating;
      } else {
        const pr = r as unknown as IRating;
        targetId = String(pr.professionalId);
        reviewerId = String(pr.raterUserId);
        score = pr.score;
      }

      const target = targetMap.get(targetId) || targetId;
      const reviewer = userMap.get(reviewerId);
      return {
        id: String(r._id),
        type,
        targetId,
        targetName: target,
        reviewerId,
        reviewerName: reviewer?.name || "",
        reviewerEmail: reviewer?.email || "",
        score,
        comment: (r as { comment?: string }).comment,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({
      ratings: enriched,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin ratings error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
