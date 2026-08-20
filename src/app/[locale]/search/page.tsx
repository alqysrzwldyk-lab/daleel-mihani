import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getT } from "@/i18n/getT";
import ProfessionFilter from "@/components/ProfessionFilter";
import ProfessionalSearchFilters from "@/components/ProfessionalSearchFilters";
import ProfessionalCard from "@/components/ProfessionalCard";
import { connectDB } from "@/lib/mongodb";
import { Professional, type IProfessional } from "@/models/Professional";
import { Search } from "lucide-react";
import Pagination from "@/components/Pagination";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    profession?: string;
    location?: string;
    availability?: string;
    verified?: string;
    page?: string;
  }>;
};

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("search");
  const T = await getT();

  const q = sp.q?.trim();
  const profession = sp.profession?.trim();
  const location = sp.location?.trim();
  const availability = sp.availability?.trim();
  const verified = sp.verified;
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  type ProfessionalsResult = Awaited<ReturnType<typeof searchProfessionals>>;

  let professionalResults: ProfessionalsResult = { data: [], total: 0 };

  try {
    professionalResults = await searchProfessionals({ q, profession, location, availability, verified, page });
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

      <div className="mb-6">
        <Suspense fallback={<div className="h-10 skeleton rounded-xl" />}>
          <ProfessionalSearchFilters />
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
            searchParams={{ q, profession, location, availability, verified }}
          />
        </>
      )}
    </div>
  );
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function searchProfessionals(params: {
  q?: string;
  profession?: string;
  location?: string;
  availability?: string;
  verified?: string;
  page?: number;
}) {
  const { q, profession, location, availability, verified, page = 1 } = params;
  await connectDB();
  const limit = 12;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };
  if (profession && profession !== "all") filter.professions = profession;
  if (location) filter.location = { $regex: escapeRegex(location), $options: "i" };
  if (availability && availability !== "all") filter.availability = availability;
  if (verified === "true") filter.verified = true;
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
      .sort({ verified: -1, averageRating: -1, ratingCount: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IProfessional[]>(),
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
  };
}
