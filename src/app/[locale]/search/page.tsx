import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import ProfessionFilter from "@/components/ProfessionFilter";
import ProfessionalCard from "@/components/ProfessionalCard";
import { connectDB } from "@/lib/mongodb";
import { Professional, type IProfessional } from "@/models/Professional";
import { Ad } from "@/models/Ad";
import { Tag, MapPin, Search } from "lucide-react";
import Pagination from "@/components/Pagination";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; profession?: string; page?: string; type?: string }>;
};

interface PublicAdItem {
  _id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  location: string;
  createdAt: string;
  specifications: Record<string, unknown>;
  images?: string[];
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("search");

  const q = sp.q?.trim();
  const profession = sp.profession?.trim();
  const type = sp.type?.trim();
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  type ProfessionalsResult = Awaited<ReturnType<typeof searchProfessionals>>;

  let professionalResults: ProfessionalsResult = { data: [], total: 0 };
  let adsResults: { data: PublicAdItem[]; total: number } = { data: [], total: 0 };

  try {
    const [proData, adsData] = await Promise.all([
      searchProfessionals(q, profession, page),
      searchPublicAds(q, profession, type, page),
    ]);
    professionalResults = proData;
    adsResults = adsData;
  } catch (error) {
    console.error("Error fetching search data:", error);
  }

  const totalResults = professionalResults.total + adsResults.total;
  const totalPages = Math.max(1, Math.ceil(professionalResults.total / 12));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t("title")}</h1>
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

      {adsResults.data.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-muted mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full" />
            الإعلانات والخدمات
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {adsResults.data.map((ad) => {
              const symbol = ad.currency === "USD" ? "$" : "﷼";
              return (
              <div key={ad._id} className="app-card flex flex-col justify-between overflow-hidden">
                {ad.images && ad.images.length > 0 && ad.images[0] && (
                  <div className="relative w-full h-40 bg-slate-100">
                    <img
                      src={ad.images[0]}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex gap-1.5 mb-2.5">
                    <span className={`badge ${ad.type === "professional" ? "badge-primary" : "badge-warning"}`}>
                      {ad.type === "professional" ? "خدمة مهنية" : "إعلان تجاري"}
                    </span>
                    <span className="badge bg-gray-50 text-gray-500 border border-gray-100">
                      {ad.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold mb-1 line-clamp-1">{ad.title}</h4>
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-3">{ad.description}</p>

                  {ad.specifications && Object.keys(ad.specifications).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Object.entries(ad.specifications).map(([key, val]) => (
                        <span key={key} className="text-[11px] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          {key === "model" ? "موديل" : "مساحة"}: {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-50 pt-2.5 px-4 pb-4 flex justify-between items-center">
                  <span className="price-tag flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    {ad.price ? `${ad.price.toLocaleString()} ${symbol}` : "حسب الاتفاق"}
                  </span>
                  <span className="text-[11px] text-muted-light flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" /> {ad.location}
                  </span>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      <div>
        {adsResults.data.length > 0 && professionalResults.data.length > 0 && (
          <h2 className="text-sm font-bold text-muted mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full" />
            المهنيين المستقلين
          </h2>
        )}

        {totalResults === 0 ? (
          <div className="empty-state">
            <Search />
            <h3>{t("noResults")}</h3>
            <p>حاول تغيير كلمات البحث أو تصفح جميع المهن</p>
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

async function searchPublicAds(q?: string, category?: string, type?: string, page = 1) {
  await connectDB();
  const limit = 12;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { status: "active" };
  if (type) filter.type = type;
  if (category && category !== "all") filter.category = category;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];
  }

  const [data, total] = await Promise.all([
    Ad.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Ad.countDocuments(filter),
  ]);

  type IAdLean = {
    _id: unknown;
    type?: string;
    category?: string;
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    location?: string;
    createdAt?: Date | string;
    specifications?: Array<[string, unknown]> | Record<string, unknown> | null | undefined;
    images?: string[];
  };

  return {
    data: (data as IAdLean[]).map((ad) => {
      const specifications = Array.isArray(ad.specifications)
        ? Object.fromEntries(ad.specifications)
        : (typeof ad.specifications === "object" && ad.specifications !== null)
        ? (ad.specifications as Record<string, unknown>)
        : {};

      return {
        _id: String(ad._id),
        type: ad.type ?? "",
        category: ad.category ?? "",
        title: ad.title ?? "",
        description: ad.description ?? "",
        price: ad.price,
        currency: ad.currency,
        location: ad.location ?? "",
        createdAt: String(ad.createdAt),
        specifications,
        images: ad.images || [],
      };
    }),
    total,
  };
}
