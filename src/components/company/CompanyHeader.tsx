"use client";

import Image from "next/image";
import {
  MapPin,
  Briefcase,
  Globe,
  Share2,
  MessageSquare,
  Eye,
  PenLine,
  Building2,
  BadgeCheck,
  Plus,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import RatingStars from "@/components/RatingStars";
import type { CompanyPublic, CompanyStats } from "@/lib/companyTypes";

type Props = {
  company: CompanyPublic;
  stats: CompanyStats;
  isOwner: boolean;
  onShare: () => void;
  onMessage: () => void;
};

// ترويسة ملف الشركة: الغلاف + الشعار + الإجراءات
export default function CompanyHeader({ company, stats, isOwner, onShare, onMessage }: Props) {
  return (
    <div className="rounded-3xl overflow-hidden border border-[var(--border)] card-shadow bg-[var(--card)]">
      {/* صورة الغلاف */}
      <div className="relative h-44 md:h-56">
        {company.cover ? (
          <Image
            src={company.cover}
            alt={company.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full gradient-hero" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-4 end-4 inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
          <Eye className="w-3.5 h-3.5" />
          {stats.views} مشاهدة
        </div>
      </div>

      {/* بيانات الشركة */}
      <div className="p-5 md:p-7">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 -mt-16 md:-mt-20 relative">
          {/* الشعار */}
          <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl border-4 border-[var(--card)] bg-[var(--surface)] overflow-hidden flex items-center justify-center shadow-lg">
            {company.logo ? (
              <Image
                src={company.logo}
                alt={company.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <Building2 className="w-12 h-12 text-[var(--muted)]" />
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-right">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-xl md:text-2xl font-black text-[var(--foreground)] flex items-center justify-center sm:justify-start gap-2">
                {company.name}
                <BadgeCheck className="w-5 h-5 text-[var(--primary)] shrink-0" />
              </h1>
              {company.industry && (
                <span className="shrink-0 w-fit mx-auto sm:mx-0 text-[11px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-2.5 py-1 rounded-full">
                  {company.industry}
                </span>
              )}
            </div>

            {company.tagline && (
              <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">{company.tagline}</p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 mt-3">
              {stats.averageRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <RatingStars rating={stats.averageRating} size="sm" />
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">({stats.reviewsCount} تقييم)</span>
                </div>
              )}
              {(company.city || company.country) && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                  {[company.city, company.country].filter(Boolean).join("، ")}
                </span>
              )}
              {stats.jobsCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Briefcase className="w-3.5 h-3.5 text-[var(--primary)]" />
                  {stats.jobsCount} وظيفة مفتوحة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-5 border-t border-[var(--border-light)]">
          {stats.jobsCount > 0 && (
            <a
              href="#company-jobs"
              className="inline-flex items-center gap-2 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] hover:opacity-95 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition active:scale-[0.98]"
            >
              <Briefcase className="w-4 h-4" />
              التقدم إلى الوظائف
            </a>
          )}

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] px-4 py-2.5 rounded-xl transition"
            >
              <Globe className="w-4 h-4" />
              الموقع الرسمي
            </a>
          )}

          <button
            onClick={onShare}
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] px-4 py-2.5 rounded-xl transition"
          >
            <Share2 className="w-4 h-4" />
            مشاركة
          </button>

          {!isOwner && (
            <button
              onClick={onMessage}
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] px-4 py-2.5 rounded-xl transition"
            >
              <MessageSquare className="w-4 h-4" />
              مراسلة الشركة
            </button>
          )}

          {isOwner && (
            <>
              <Link
                href="/dashboard/jobs/new"
                className="ms-auto inline-flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] hover:opacity-95 px-4 py-2.5 rounded-xl transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                إضافة إعلان توظيف
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/25 hover:bg-[var(--primary)]/15 px-4 py-2.5 rounded-xl transition"
              >
                <PenLine className="w-4 h-4" />
                تعديل الملف من لوحة التحكم
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
