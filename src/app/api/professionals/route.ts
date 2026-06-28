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

    // دعم كامل ومضمون للبحث بالفلاتر سواء كانت المهنة مخزنة كمصفوفة أو كحقل مفرد
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
        .lean(),
      Professional.countDocuments(filter),
    ]);

    // معالجة وتأمين البيانات الراجعة للـ Client لضمان ملء المصفوفة والحقل المفرد بشكل متبادل
    const mappedData = (data as any[]).map((p) => {
      const professionsArray = Array.isArray(p.professions) ? p.professions : [];
      const singleProf = p.profession || professionsArray[0] || "";
      const finalArray = professionsArray.length > 0 ? professionsArray : (singleProf ? [singleProf] : []);

      return {
        ...p,
        _id: String(p._id),
        professions: finalArray,
        profession: singleProf,
      };
    });

    return NextResponse.json({
      data: mappedData,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Professionals list error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}