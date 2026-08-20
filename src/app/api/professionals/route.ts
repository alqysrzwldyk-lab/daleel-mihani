import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Professional, type IProfessional } from "@/models/Professional";

// تعقيم المدخلات قبل استخدامها في الـ RegExp لمنع ثغرات التعبيرات المنتظمة
function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const profession = searchParams.get("profession")?.trim();
    const location = searchParams.get("location")?.trim();
    const availability = searchParams.get("availability")?.trim();
    const verified = searchParams.get("verified");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };

    if (profession && profession !== "all") {
      filter.professions = profession;
    }

    if (location) {
      filter.location = { $regex: escapeRegex(location), $options: "i" };
    }

    if (availability && availability !== "all") {
      filter.availability = availability;
    }

    if (verified === "true") {
      filter.verified = true;
    }

    if (q) {
      const rx = { $regex: escapeRegex(q), $options: "i" };
      filter.$or = [
        { name: rx },
        { professions: rx },
        { profession: rx },
        { bio: rx },
        { skills: rx },
        { location: rx },
        { specialization: rx },
        { objective: rx },
        { currentWorkplace: rx },
        { education: rx },
        { "languages.name": rx },
      ];
    }

    const [data, total] = await Promise.all([
      Professional.find(filter)
        .sort({ verified: -1, averageRating: -1, ratingCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IProfessional[]>(),
      Professional.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: data.map((p) => ({
        _id: String(p._id),
        userId: String(p.userId),
        name: p.name,
        photo: p.photo,
        professions: p.professions,
        profession: p.professions?.[0] || "other",
        bio: p.bio,
        skills: p.skills,
        workExperience: p.workExperience,
        location: p.location,
        phone: p.phone,
        email: p.email,
        averageRating: p.averageRating,
        ratingCount: p.ratingCount,
        verified: p.verified,
        availability: p.availability,
        cover: p.cover,
        specialization: p.specialization,
        experienceYears: p.experienceYears,
        skillLevels: p.skillLevels,
        languages: p.languages,
        social: p.social,
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
