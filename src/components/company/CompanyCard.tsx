"use client";

import Image from "next/image";
import { MapPin, Briefcase, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SimilarCompany } from "@/lib/companyTypes";

// بطاقة شركة للقسم: "شركات مشابهة"
export default function CompanyCard({ company }: { company: SimilarCompany }) {
  return (
    <Link
      href={`/company/${company._id}`}
      className="group relative bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-5 hover:shadow-xl hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all duration-300 flex flex-col gap-4 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex items-center justify-center">
          {company.logo ? (
            <Image
              src={company.logo}
              alt={company.name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <Briefcase className="w-7 h-7 text-[var(--muted)]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
            {company.name}
          </h3>
          {company.industry && (
            <p className="text-xs text-[var(--muted)] font-medium mt-0.5 line-clamp-1">
              {company.industry}
            </p>
          )}
        </div>

        {company.averageRating > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[var(--foreground)] bg-[var(--surface)] border border-[var(--border)] px-2 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {company.averageRating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          {(company.city || company.country) && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
              {[company.city, company.country].filter(Boolean).join("، ")}
            </span>
          )}
        </div>
        {company.openJobs > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/25 px-2.5 py-1 rounded-full">
            {company.openJobs} وظيفة مفتوحة
          </span>
        )}
      </div>
    </Link>
  );
}
