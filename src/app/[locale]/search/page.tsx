import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import SearchBar from "@/components/SearchBar";
import ProfessionFilter from "@/components/ProfessionFilter";
import ProfessionalCard from "@/components/ProfessionalCard";
import { connectDB } from "@/lib/mongodb";
import { Professional, type IProfessional } from "@/models/Professional";
import { Ad } from "@/models/Ad"; // استيراد موديل الإعلانات الجديد
import { Tag, MapPin, Layers } from "lucide-react"; // استيراد أيقونات لتمييز الإعلانات العامة

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; profession?: string; page?: string; type?: string }>;
};

// 🌟 تعريف تيب صارم ونظيف للإعلانات لمنع أخطاء الـ any في الـ map
interface PublicAdItem {
  _id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  price?: number;
  location: string;
  createdAt: string;
  specifications: Record<string, unknown>;
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("search");

  const q = sp.q?.trim();
  const profession = sp.profession?.trim();
  const type = sp.type?.trim(); // تصفية حسب نوع الإعلان (general أو professional)
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  // جلب البيانات المهنية والإعلانات في نفس الوقت لسرعة الأداء
  type ProfessionalsResult = Awaited<ReturnType<typeof searchProfessionals>>;
  
  let professionalResults: ProfessionalsResult = { data: [], total: 0 };
  let adsResults: { data: PublicAdItem[]; total: number } = { data: [], total: 0 };

  try {
    const [proData, adsData] = await Promise.all([
      searchProfessionals(q, profession, page),
      searchPublicAds(q, profession, type, page)
    ]);
    professionalResults = proData;
    adsResults = adsData;
  } catch (error) {
    console.error("Error fetching search data:", error);
  }

  const totalResults = professionalResults.total + adsResults.total;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" style={{ direction: "rtl" }}>
      <h1 className="text-3xl font-black mb-6 text-gray-800">{t("title")}</h1>

      {/* شريط البحث المخصص */}
      <div className="mb-6">
        <SearchBar initialQuery={q} />
      </div>

      {/* شريط فلترة المهن والأقسام */}
      <Suspense fallback={<div className="h-10 animate-pulse bg-gray-50 rounded-xl" />}>
        <ProfessionFilter />
      </Suspense>

      {/* العداد الإجمالي للنتائج */}
      <p className="text-[var(--muted)] my-6 text-xs font-bold">
        {t("resultsCount", { count: totalResults })}
      </p>

      {/* ─── القسم الأول: الإعلانات المضافة (سيارات، عقارات، إعلانات مهنية) ─── */}
      {adsResults.data.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">📢 الإعلانات التجارية والخدمات المضافة حديثاً</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {adsResults.data.map((ad: PublicAdItem) => ( // 🌟 تم استبدال any بـ PublicAdItem لمنع الخطأ
              <div key={ad._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  {/* شارات نوع الإعلان والقسم */}
                  <div className="flex gap-1.5 mb-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${ad.type === "professional" ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                      {ad.type === "professional" ? "💼 خدمة مهنية" : "📦 إعلان تجاري"}
                    </span>
                    <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md text-[9px] font-bold border border-gray-100 flex items-center gap-0.5">
                      <Layers className="w-2.5 h-2.5 text-gray-400" /> {ad.category}
                    </span>
                  </div>

                  {/* عنوان الإعلان وتفاصيله */}
                  <h4 className="text-xs font-black text-gray-800 mb-1.5 line-clamp-1">{ad.title}</h4>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-3">{ad.description}</p>

                  {/* عرض مواصفات الإعلان إن وجدت */}
                  {ad.specifications && Object.keys(ad.specifications).length > 0 && (
                    <div className="bg-gray-50 p-2 rounded-xl mb-3 flex flex-wrap gap-2 text-[10px] text-gray-600 font-bold border border-gray-100">
                      {Object.entries(ad.specifications).map(([key, val]) => ( // 🌟 تم حذف تيب any للمصفوفة الفرعية
                        <span key={key} className="bg-white px-2 py-0.5 rounded border border-gray-100">
                          🔹 {key === "model" ? "الموديل" : "المساحة"}: <strong className="text-gray-900">{String(val)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* جزء السعر والموقع */}
                <div className="border-t border-gray-50 pt-2.5 flex justify-between items-center">
                  <span className="text-xs font-black text-orange-500 flex items-center gap-0.5">
                    <Tag className="w-3.5 h-3.5 text-orange-400" />
                    {ad.price ? `${ad.price.toLocaleString()} دينار` : "حسب الاتفاق"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-gray-300" /> {ad.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── القسم الثاني: بطاقات المهنيين المسجلين (الملفات الشخصية) ─── */}
      <div>
        {adsResults.data.length > 0 && professionalResults.data.length > 0 && (
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">💼 بطاقات وتخصصات المهنيين المستقلين</h2>
        )}

        {totalResults === 0 ? (
          <div className="text-center py-16 text-[var(--muted)] border border-dashed rounded-3xl bg-gray-50/50">
            <p className="text-sm font-medium">{t("noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {professionalResults.data.map((pro) => (
              <ProfessionalCard key={pro._id} professional={pro} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 🛠️ دالة جلب المهنيين (الملفات الشخصية الأصلية)
async function searchProfessionals(q?: string, profession?: string, page = 1) {
  await connectDB();
  const limit = 12;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };
  if (profession && profession !== "all") filter.profession = profession;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { profession: { $regex: q, $options: "i" } },
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
      profession: p.profession,
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

// 🛠️ دالة جلب الإعلانات العامة والمهنية الديناميكية المضافة حديثاً
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
    location?: string;
    createdAt?: Date | string;
    specifications?: Array<[string, unknown]> | Record<string, unknown> | null | undefined;
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
        location: ad.location ?? "",
        createdAt: String(ad.createdAt),
        specifications,
      };
    }),
    total,
  };
}