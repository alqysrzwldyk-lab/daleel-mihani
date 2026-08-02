import { getTranslations, setRequestLocale } from "next-intl/server";
import { connectDB } from "@/lib/mongodb";
import { Professional, type IProfessional } from "@/models/Professional";
import { PROFESSIONS } from "@/lib/professions";
import { getAuthFromCookies } from "@/lib/auth";
import { User } from "@/models/User";
import HeroSection from "@/components/landing/HeroSection";
import QuickAccess from "@/components/landing/QuickAccess";
import StatsSection from "@/components/landing/StatsSection";
import ProfessionsGrid from "@/components/landing/ProfessionsGrid";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import CtaSection from "@/components/landing/CtaSection";
import LandingFooter from "@/components/landing/LandingFooter";
import ProfessionalCard from "@/components/ProfessionalCard";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("home");

  let isLoggedIn = false;
  let userRole: "professional" | "employer" | null = null;

  try {
    const auth = await getAuthFromCookies();
    if (auth?.userId) {
      isLoggedIn = true;
      await connectDB();
      const user = await User.findById(auth.userId);
      if (user) userRole = user.role;
    }
  } catch {}

  let professionals: Awaited<ReturnType<typeof getAllProfessionals>> = [];

  try {
    professionals = await getAllProfessionals();
  } catch {
    professionals = [];
  }

  const grouped = groupByProfession(professionals);

  return (
    <>
      <HeroSection isLoggedIn={isLoggedIn} />

      <QuickAccess />

      <StatsSection />

      <FeaturesSection />

      <HowItWorks />

      <ProfessionsGrid />

      <TestimonialsSection />

      <WhyChooseUs />

      <CtaSection isLoggedIn={isLoggedIn} />

      {/* Existing data sections */}
      <section className="py-8">
        <div className="page-container">
          {grouped.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-extrabold mb-4">{tHome("browseProfessions")}</h2>
              <div className="h-scroll">
                {grouped.map(({ key, icon, arabic, count }) => (
                  <Link
                    key={key}
                    href={`/search?profession=${key}`}
                    className="app-card app-card-hover flex flex-col items-center justify-center p-3 gap-1 text-center h-scroll-card"
                    style={{ width: 120, minWidth: 120 }}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-semibold text-muted">{arabic}</span>
                    <span className="text-[10px] text-muted-light">{count}</span>
                  </Link>
                ))}
                <Link
                  href="/search"
                  className="app-card app-card-hover flex flex-col items-center justify-center p-3 gap-1 text-center h-scroll-card"
                  style={{ width: 100, minWidth: 100 }}
                >
                  <span className="text-sm font-bold text-primary">عرض الكل</span>
                  <span className="text-xs">←</span>
                </Link>
              </div>
            </section>
          )}

          {grouped.map(({ key, icon, arabic, list }) => (
            <section key={key} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold flex items-center gap-2">
                  <span>{icon}</span>
                  <span>{arabic}</span>
                </h3>
                <Link href={`/search?profession=${key}`} className="text-sm text-primary font-semibold">
                  عرض الكل ←
                </Link>
              </div>
              <div className="h-scroll">
                {list.map((pro) => (
                  <div key={pro._id} className="h-scroll-card h-scroll-card-wide">
                    <ProfessionalCard professional={pro} />
                  </div>
                ))}
              </div>
            </section>
          ))}

        </div>
      </section>

      <LandingFooter />
    </>
  );
}

async function getAllProfessionals() {
  await connectDB();
  const data = await Professional.find({ isActive: true })
    .sort({ averageRating: -1, ratingCount: -1 })
    .limit(50)
    .lean<IProfessional[]>();

  return data.map((p) => ({
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
  }));
}

function groupByProfession(all: Awaited<ReturnType<typeof getAllProfessionals>>) {
  const map = new Map<string, typeof all>();

  for (const pro of all) {
    const key = pro.professions?.[0] || "other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(pro);
  }

  return Array.from(map.entries())
    .map(([key, list]) => {
      const found = PROFESSIONS.find((p) => p.key === key);
      return {
        key,
        icon: found?.icon || "⭐",
        arabic: found?.arabic || key,
        count: list.length,
        list,
      };
    })
    .sort((a, b) => b.count - a.count);
}
