"use client";

import { Target, Eye, ListChecks, Puzzle, HeartHandshake } from "lucide-react";
import type { CompanyPublic } from "@/lib/companyTypes";

// قسم نبذة عن الشركة: الوصف + الرسالة والرؤية + الأنشطة والتخصصات والقيم
export default function CompanyAbout({ company }: { company: CompanyPublic }) {
  const hasMission = !!company.mission || !!company.vision;
  const hasLists =
    company.businessActivities.length > 0 ||
    company.specializations.length > 0 ||
    company.values.length > 0;

  if (!company.description && !hasMission && !hasLists) return null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8">
      <h2 className="text-lg font-black text-[var(--foreground)] mb-4">🏢 عن الشركة</h2>

      {company.description && (
        <p className="text-[var(--muted)] leading-loose text-sm md:text-base whitespace-pre-line">
          {company.description}
        </p>
      )}

      {hasMission && (
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          {company.mission && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                  <Target className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <h3 className="font-bold text-sm text-[var(--foreground)]">رسالتنا</h3>
              </div>
              <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
                {company.mission}
              </p>
            </div>
          )}
          {company.vision && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                  <Eye className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <h3 className="font-bold text-sm text-[var(--foreground)]">رؤيتنا</h3>
              </div>
              <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
                {company.vision}
              </p>
            </div>
          )}
        </div>
      )}

      {company.businessActivities.length > 0 && (
        <div className="mt-5">
          <h3 className="flex items-center gap-2 font-bold text-sm text-[var(--foreground)] mb-2.5">
            <ListChecks className="w-4 h-4 text-[var(--primary)]" />
            الأنشطة التجارية
          </h3>
          <ul className="grid sm:grid-cols-2 gap-2">
            {company.businessActivities.map((activity) => (
              <li
                key={activity}
                className="flex items-center gap-2 text-sm text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3.5 py-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                {activity}
              </li>
            ))}
          </ul>
        </div>
      )}

      {company.specializations.length > 0 && (
        <div className="mt-5">
          <h3 className="flex items-center gap-2 font-bold text-sm text-[var(--foreground)] mb-2.5">
            <Puzzle className="w-4 h-4 text-[var(--primary)]" />
            التخصصات
          </h3>
          <div className="flex flex-wrap gap-2">
            {company.specializations.map((spec) => (
              <span
                key={spec}
                className="bg-[var(--primary)]/5 text-[var(--primary)] border border-[var(--primary)]/15 px-3.5 py-1.5 rounded-full text-sm font-semibold"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {company.values.length > 0 && (
        <div className="mt-5">
          <h3 className="flex items-center gap-2 font-bold text-sm text-[var(--foreground)] mb-2.5">
            <HeartHandshake className="w-4 h-4 text-[var(--primary)]" />
            قيمنا
          </h3>
          <div className="flex flex-wrap gap-2">
            {company.values.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-3.5 py-1.5 rounded-full font-semibold"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
