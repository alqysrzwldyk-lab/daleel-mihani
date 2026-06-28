"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin, Briefcase } from "lucide-react";
import { Link } from "@/i18n/navigation";
import RatingStars from "./RatingStars";
import { PROFESSIONS } from "@/lib/professions";

type Props = {
  professional: any; // لمنع تعارض الأنظمة الصارمة أثناء الـ Build
};

export default function ProfessionalCard({ professional }: Props) {
  const t = useTranslations("card");
  const tProf = useTranslations("professions");

  // استخراج المهن بأمان لتغطية البيانات الجديدة والقديمة المفردة
  const professionsList: string[] = Array.isArray(professional.professions)
    ? professional.professions
    : professional.profession
    ? [professional.profession]
    : [];

  const firstProfKey = professionsList[0] || "";
  const professionIcon = PROFESSIONS.find((p) => p.key === firstProfKey)?.icon || "✨";
  const expYears = professional.workExperience?.length || 0;

  // توجيه آمن: نفضل الـ userId ليتوافق تماماً مع حماية التوظيف والـ Auth في صفحة البروفايل
  const profileId = professional.userId || professional._id;

  return (
    <article className="bg-[var(--card)] rounded-2xl card-shadow transition-all duration-300 overflow-hidden border border-[var(--border)] group flex flex-col justify-between h-full">
      <div>
        <div className="relative h-32 gradient-hero flex items-end justify-center">
          <div className="absolute -bottom-10 w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-slate-200 shadow-lg">
            {professional.photo ? (
              <Image
                src={professional.photo}
                alt={professional.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl bg-slate-100">
                {professionIcon}
              </div>
            )}
          </div>
        </div>

        <div className="pt-12 pb-2 px-5 text-center">
          <h3 className="font-bold text-lg text-[var(--foreground)] group-hover:text-[var(--primary)] transition truncate">
            {professional.name}
          </h3>
          
          {/* عرض المهن المتعددة كـ Badges صغيرة متناسقة داخل الكارد */}
          <div className="flex flex-wrap justify-center gap-1 mt-2 min-h-[24px]">
            {professionsList.slice(0, 2).map((profKey) => {
              const matched = PROFESSIONS.find((p) => p.key === profKey);
              return (
                <span key={profKey} className="text-xs bg-blue-50 text-[var(--primary)] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span>{matched ? matched.icon : "✨"}</span>
                  {matched ? tProf(profKey as any) : profKey}
                </span>
              );
            })}
            {professionsList.length > 2 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                +{professionsList.length - 2}
              </span>
            )}
          </div>

          {professional.bio && (
            <p className="text-[var(--muted)] text-sm mt-2 line-clamp-2 min-h-[40px]">{professional.bio}</p>
          )}
        </div>
      </div>

      <div className="pb-5 px-5 text-center">
        <div className="flex items-center justify-center gap-4 mt-1 text-xs text-[var(--muted)]">
          {professional.location && (
            <span className="flex items-center gap-1 truncate max-w-[120px]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {professional.location}
            </span>
          )}
          {expYears > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
              {expYears} {t("experience")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <RatingStars rating={professional.averageRating || 0} size="sm" />
          {professional.ratingCount > 0 && (
            <span className="text-xs text-[var(--muted)]">
              ({professional.ratingCount} {t("reviews")})
            </span>
          )}
        </div>

        <Link
          href={`/professionals/${profileId}`}
          className="mt-4 inline-block w-full btn-primary text-center text-sm"
        >
          {t("viewProfile")}
        </Link>
      </div>
    </article>
  );
}