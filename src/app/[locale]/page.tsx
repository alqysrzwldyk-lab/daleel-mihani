import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SearchBar from "@/components/SearchBar";
import ProfessionalCard from "@/components/ProfessionalCard";
import { connectDB } from "@/lib/mongodb";
import { Professional, type IProfessional } from "@/models/Professional";
import { PROFESSIONS } from "@/lib/professions";
import { getAuthFromCookies } from "@/lib/auth"; // استيراد دالة التحقق من الجلسة
import { User } from "@/models/User"; // استيراد موديل المستخدم لمعرفة الـ Role

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hero");
  const tHome = await getTranslations("home");
  const tProf = await getTranslations("professions");

  // فحص حالة الجلسة، الدور، والملف التعريفي مباشرة على السيرفر
  let isLoggedIn = false;
  let userRole: "professional" | "employer" | null = null;
  let hasProfile = false;

  try {
    const auth = await getAuthFromCookies();
    if (auth?.userId) {
      isLoggedIn = true;
      await connectDB();
      
      // جلب بيانات المستخدم لمعرفة صلاحيته (مهني أم صاحب شركة)
      const user = await User.findById(auth.userId);
      if (user) {
        userRole = user.role;
        
        // إذا كان مهني، نفحص هل أنشأ ملفه التعريفي أم لا
        if (userRole === "professional") {
          const profile = await Professional.findOne({ userId: auth.userId });
          hasProfile = !!profile;
        }
      }
    }
  } catch (error) {
    console.error("Error checking auth status:", error);
  }

  let featured: Awaited<ReturnType<typeof getFeatured>> = [];
  try {
    featured = await getFeatured();
  } catch {
    featured = [];
  }

  return (
    <>
      <section className="gradient-hero text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">{t("subtitle")}</p>
          <SearchBar variant="hero" />
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            {/* السيناريو الأول: المستخدم غير مسجل دخول من الأساس (عرض الأزرار الافتراضية) */}
            {!isLoggedIn && (
              <>
                <Link href="/register?role=professional" className="btn-outline">
                  {t("ctaProfessional")}
                </Link>
                <Link href="/register?role=employer" className="btn-outline">
                  {t("ctaEmployer")}
                </Link>
              </>
            )}

            {/* السيناريو الثاني: المسجل هو "مهني" (Professional) */}
            {isLoggedIn && userRole === "professional" && (
              hasProfile ? (
                <Link href="/dashboard" className="btn-outline bg-white text-blue-600 hover:bg-gray-100">
                  الانتقال إلى لوحتي (مهني)
                </Link>
              ) : (
                <Link href="/create-profile" className="btn-outline bg-green-600 text-white hover:bg-green-700">
                  أنا محترف — أنشئ ملفي الآن
                </Link>
              )
            )}

            {/* السيناريو الثالث: المسجل هو "صاحب شركة / صاحب عمل" (Employer) */}
            {isLoggedIn && userRole === "employer" && (
              <>
                <Link href="/dashboard" className="btn-outline bg-white text-blue-600 hover:bg-gray-100">
                  لوحة تحكم الشركات
                </Link>
                <Link href="/search" className="btn-outline">
                  ابحث عن محترفين موظفين
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">{tHome("browseProfessions")}</h2>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {PROFESSIONS.slice(0, 8).map((p) => (
            <Link
              key={p.key}
              href={`/search?profession=${p.key}`}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md transition"
            >
              <span className="text-xl">{p.icon}</span>
              <span className="font-medium text-sm">{tProf(p.key)}</span>
            </Link>
          ))}
        </div>

        {featured.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-6">{tHome("featured")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featured.map((pro) => (
                <ProfessionalCard key={pro._id} professional={pro} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

async function getFeatured() {
  await connectDB();
  const data = await Professional.find({ isActive: true })
    .sort({ averageRating: -1, ratingCount: -1 })
    .limit(8)
    .lean<IProfessional[]>();

  return data.map((p) => ({
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
  }));
}