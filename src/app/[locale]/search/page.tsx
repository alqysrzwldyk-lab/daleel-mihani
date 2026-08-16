import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getT } from "@/i18n/getT";
import ProfessionFilter from "@/components/ProfessionFilter";
import ProfessionalCard from "@/components/ProfessionalCard";
import { connectDB } from "@/lib/mongodb";
import { Professional, type IProfessional } from "@/models/Professional";
import { Search } from "lucide-react";
import Pagination from "@/components/Pagination";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; profession?: string; page?: string }>;
};

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("search");
  const T = await getT();

  const q = sp.q?.trim();
  const profession = sp.profession?.trim();
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  type ProfessionalsResult = Awaited<ReturnType<typeof searchProfessionals>>;

  let professionalResults: ProfessionalsResult = { data: [], total: 0 };

  try {
    professionalResults = await searchProfessionals(q, profession, page);
  } catch (error) {
    console.error("Error fetching search data:", error);
  }

  const totalResults = professionalResults.total;
  const totalPages = Math.max(1, Math.ceil(professionalResults.total / 12));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{T("تصفح جميع المهنيين")}</h1>
        {q && (
          <span className="badge badge-primary text-sm">
            &ldquo;{q}&rdquo;
          </span>
        )}
      </div>

      {totalResults > 0 && (
        <p className="text-xs text-muted mb-4">
          {t("resultsCount", { count: totalResults })}
        </p>
      )}

      <div className="mb-4">
        <Suspense fallback={<div className="h-10 skeleton rounded-xl" />}>
          <ProfessionFilter />
        </Suspense>
      </div>

      {totalResults === 0 ? (
        <div className="empty-state">
          <Search />
          <h3>{t("noResults")}</h3>
          <p>{T("حاول تغيير كلمات البحث أو تصفح جميع المهن")}</p>
        </div>
      ) : (
        <>
          <div className="pro-grid">
            {professionalResults.data.map((pro) => (
              <ProfessionalCard key={pro._id} professional={pro} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/search"
            searchParams={{ q, profession }}
          />
        </>
      )}
    </div>
  );
}

async function searchProfessionals(q?: string, profession?: string, page = 1) {
  await connectDB();
  const limit = 12;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };
  if (profession && profession !== "all") filter.professions = profession;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { professions: { $regex: q, $options: "i" } },
      { bio: { $regex: q, $options: "i" } },
      { skills: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];
  }

  const [data, total] = await Promise.all([
    Professional.find(filter).sort({ averageRating: -1 }).skip(skip).limit(limit).lean<IProfessional[]>(),
    Professional.countDocuments(filter),
  ]);

  return {
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
    })),
    total,
  };
}
