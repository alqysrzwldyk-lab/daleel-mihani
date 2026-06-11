"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin, Briefcase } from "lucide-react";
import { Link } from "@/i18n/navigation";
import RatingStars from "./RatingStars";
import type { ProfessionalPublic } from "@/lib/api";
import { PROFESSIONS } from "@/lib/professions";

type Props = {
  professional: ProfessionalPublic;
};

export default function ProfessionalCard({ professional }: Props) {
  const t = useTranslations("card");
  const tProf = useTranslations("professions");

  const professionIcon = PROFESSIONS.find((p) => p.key === professional.profession)?.icon || "✨";
  const expYears = professional.workExperience?.length || 0;

  return (
    <article className="bg-[var(--card)] rounded-2xl card-shadow transition-all duration-300 overflow-hidden border border-[var(--border)] group">
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

      <div className="pt-12 pb-5 px-5 text-center">
        <h3 className="font-bold text-lg text-[var(--foreground)] group-hover:text-[var(--primary)] transition">
          {professional.name}
        </h3>
        <p className="text-[var(--primary)] font-medium text-sm mt-1 flex items-center justify-center gap-1">
          <span>{professionIcon}</span>
          {tProf(professional.profession as "programmer")}
        </p>

        {professional.bio && (
          <p className="text-[var(--muted)] text-sm mt-2 line-clamp-2">{professional.bio}</p>
        )}

        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[var(--muted)]">
          {professional.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {professional.location}
            </span>
          )}
          {expYears > 0 && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {expYears} {t("experience")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <RatingStars rating={professional.averageRating} size="sm" />
          {professional.ratingCount > 0 && (
            <span className="text-xs text-[var(--muted)]">
              ({professional.ratingCount} {t("reviews")})
            </span>
          )}
        </div>

        {professional.skills?.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {professional.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="text-xs bg-blue-50 text-[var(--primary)] px-2 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}

        <Link
          href={`/professionals/${professional._id}`}
          className="mt-4 inline-block w-full btn-primary text-center text-sm"
        >
          {t("viewProfile")}
        </Link>
      </div>
    </article>
  );
}
