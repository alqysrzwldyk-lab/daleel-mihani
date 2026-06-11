import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { Professional } from "@/models/Professional";
import { Rating } from "@/models/Rating";

const schema = z.object({
  score: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "employer") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = schema.parse(body);

    await connectDB();

    const professional = await Professional.findById(id);
    if (!professional || !professional.isActive) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const existing = await Rating.findOne({
      professionalId: professional._id,
      raterUserId: auth.userId,
    });

    if (existing) {
      return NextResponse.json({ error: "alreadyRated" }, { status: 409 });
    }

    await Rating.create({
      professionalId: professional._id,
      raterUserId: auth.userId,
      score: data.score,
      comment: data.comment,
    });

    const stats = await Rating.aggregate([
      { $match: { professionalId: professional._id } },
      {
        $group: {
          _id: null,
          average: { $avg: "$score" },
          count: { $sum: 1 },
        },
      },
    ]);

    professional.averageRating = Math.round((stats[0]?.average || 0) * 10) / 10;
    professional.ratingCount = stats[0]?.count || 0;
    await professional.save();

    return NextResponse.json({
      averageRating: professional.averageRating,
      ratingCount: professional.ratingCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    console.error("Rating error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
