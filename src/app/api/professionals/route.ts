import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Professional } from "@/models/Professional";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const profession = searchParams.get("profession")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };

    // دعم البحث في المهن الفردية والمصفوفات معاً
    if (profession && profession !== "all") {
      filter.$or = [
        { profession: profession },
        { professions: profession }
      ];
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { profession: { $regex: q, $options: "i" } },
        { professions: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
        { skills: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      Professional.find(filter)
        .sort({ averageRating: -1, ratingCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // تم إزالة الـ Generic الصارم
      Professional.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: (data as any[]).map((p) => ({
        ...p,
        _id: String(p._id),
        professions: p.professions || (p.profession ? [p.profession] : []),
        profession: p.profession || (p.professions?.[0] || ""),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Professionals list error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}