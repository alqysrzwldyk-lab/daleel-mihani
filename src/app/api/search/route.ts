import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Professional } from "@/models/Professional";
import { Company } from "@/models/Company";
import { JobAdvertisement } from "@/models/JobAdvertisement";
import { Ad } from "@/models/Ad";

export const dynamic = "force-dynamic";

// تعقيم المدخلات قبل استخدامها في الـ RegExp لمنع ثغرات التعبيرات المنتظمة
function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PER_CATEGORY_LIMIT = 5;

// بحث عالمي موحد يعيد نتائج من أربع فئات: مهنيون، شركات، وظائف، إعلانات
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().slice(0, 100);

    // لا نبحث عن أقل من حرفين لتجنب النتائج غير الدقيقة
    if (q.length < 2) {
      return NextResponse.json({ q: "", professionals: [], companies: [], jobs: [], ads: [] });
    }

    const rx = new RegExp(escapeRegex(q), "i");

    await connectDB();

    const [professionals, companies, jobs, ads] = await Promise.all([
      Professional.find({
        isActive: true,
        $or: [
          { name: rx },
          { professions: rx },
          { profession: rx },
          { skills: rx },
          { bio: rx },
          { location: rx },
        ],
      })
        .select("name photo professions profession location averageRating")
        .limit(PER_CATEGORY_LIMIT)
        .lean(),
      Company.find({
        $or: [{ name: rx }, { industry: rx }, { city: rx }, { description: rx }],
      })
        .select("name logo industry city")
        .limit(PER_CATEGORY_LIMIT)
        .lean(),
      JobAdvertisement.find({
        status: "open",
        $or: [
          { jobTitle: rx },
          { companyName: rx },
          { department: rx },
          { skills: rx },
          { city: rx },
        ],
      })
        .select("jobTitle companyName city status")
        .limit(PER_CATEGORY_LIMIT)
        .lean(),
      Ad.find({
        status: "active",
        $or: [{ title: rx }, { description: rx }, { category: rx }, { location: rx }],
      })
        .select("title category type location")
        .limit(PER_CATEGORY_LIMIT)
        .lean(),
    ]);

    return NextResponse.json({
      q,
      professionals: professionals.map((p) => ({
        _id: String(p._id),
        name: p.name,
        photo: p.photo,
        professions: p.professions || (p.profession ? [p.profession] : []),
        location: p.location,
        averageRating: p.averageRating,
      })),
      companies: companies.map((c) => ({
        _id: String(c._id),
        name: c.name,
        logo: c.logo,
        industry: c.industry,
        city: c.city,
      })),
      jobs: jobs.map((j) => ({
        _id: String(j._id),
        jobTitle: j.jobTitle,
        companyName: j.companyName,
        city: j.city,
        status: j.status,
      })),
      ads: ads.map((a) => ({
        _id: String(a._id),
        title: a.title,
        category: a.category,
        type: a.type,
        location: a.location,
      })),
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
