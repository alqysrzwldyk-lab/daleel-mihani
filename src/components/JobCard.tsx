"use client";

import Image from "next/image";
import { MapPin, Clock, Banknote, Building2, CalendarDays, Eye, Users, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useT } from "@/lib/useT";
import type { JobItem } from "@/lib/jobTypes";

function formatDate(value: string | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

// بطاقة وظيفة عصرية مشابهة لمنصات LinkedIn و Indeed و Bayt
export default function JobCard({ job }: { job: JobItem }) {
  const T = useT();
  return (
    <div className="group relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 card-shadow hover:shadow-xl hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all duration-300 flex flex-col gap-4 overflow-hidden">
      {/* شريط علوي متوهج عند التمرير */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-4">
        {/* شعار الشركة — رابط لملف الشركة */}
        <Link
          href={`/company/${job.companyId}`}
          className="w-14 h-14 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex items-center justify-center hover:border-[var(--primary)] transition-colors"
          title={T("ملف الشركة")}
        >
          {job.companyLogo ? (
            <Image
              src={job.companyLogo}
              alt={job.companyName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-7 h-7 text-[var(--muted)]" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/jobs/${job._id}`}>
            <h3 className="font-bold text-lg text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
              {job.jobTitle}
            </h3>
          </Link>
          <Link
            href={`/company/${job.companyId}`}
            className="text-sm text-[var(--muted)] font-medium mt-0.5 line-clamp-1 hover:text-[var(--primary)] transition-colors inline-block"
            title={T("عرض ملف شركة {name}", { name: job.companyName })}
          >
            {job.companyName}
          </Link>
        </div>

        {/* حالة مفتوحة */}
        {job.status === "open" ? (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--success)] bg-[var(--success)]/15 border border-[var(--success)]/25 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            {T("مفتوح")}
          </span>
        ) : (
          <span className="shrink-0 text-[11px] font-bold text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-full">
            {T("مغلق")}
          </span>
        )}
      </div>

      {/* الشارات: الموقع، نوع الدوام، القسم */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
          <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
          {job.city}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
          {job.workType}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
          {job.department}
        </span>
      </div>

      {/* السطر السفلي */}
      <div className="mt-auto pt-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {job.salary && (
            <span className="inline-flex items-center gap-1.5 text-sm font-black text-[var(--primary)]">
              <Banknote className="w-4 h-4" />
              {job.salary}
              {job.salaryType ? ` ${job.salaryType}` : ""}
            </span>
          )}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <CalendarDays className="w-3.5 h-3.5" />
            {formatDate(job.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
            <Eye className="w-3.5 h-3.5" /> {job.views}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
            <Users className="w-3.5 h-3.5" /> {job.applicationsCount}
          </span>
          <Link
            href={`/jobs/${job._id}`}
            className="inline-flex items-center gap-1 text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-3.5 py-2 rounded-xl group-hover:bg-[var(--primary)] group-hover:text-white transition-colors"
          >
            {T("عرض التفاصيل")}
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
