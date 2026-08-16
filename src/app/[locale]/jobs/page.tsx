"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Briefcase, Loader2, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import JobsFilter from "@/components/JobsFilter";
import JobCard from "@/components/JobCard";
import type { JobItem } from "@/lib/jobTypes";
import { useT } from "@/lib/useT";

const PAGE_SIZE = 12;

function JobsPageInner() {
  const T = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authOk, setAuthOk] = useState(false);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        // صفحة طلبات التوظيف متاحة للمهنيين فقط
        if (!d.user || d.user.role !== "professional") {
          router.push("/login");
          return;
        }
        setAuthOk(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!authOk) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    fetch(`/api/jobs?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setJobs(d.data || []);
        setTotal(d.total || 0);
      })
      .catch(() => {
        setJobs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [authOk, page, searchParams]);

  function goToPage(nextPage: number) {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ترويسة الصفحة */}
      <div className="gradient-hero rounded-2xl p-8 md:p-10 text-white mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%)" }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-sm">
              <Briefcase className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black">{T("طلبات التوظيف")}</h1>
          </div>
          <p className="text-sm md:text-base text-blue-100 max-w-2xl leading-relaxed">
            {T("تصفح أحدث فرص العمل المنشورة من الشركات المعتمدة على المنصة، وقدّم على الوظيفة التي تناسب مهاراتك مباشرة خلال دقائق.")}
          </p>
        </div>
      </div>

      {/* البحث والتصفية */}
      <div className="mb-8">
        <JobsFilter />
      </div>

      {/* النتائج */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--muted)] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <span className="text-sm font-bold">{T("جاري تحميل الوظائف...")}</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--card)]">
          <SearchX className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
          <p className="font-bold text-[var(--foreground)]">{T("لا توجد وظائف مطابقة لبحثك")}</p>
          <p className="text-sm text-[var(--muted)] mt-1.5">{T("جرّب تعديل الفلاتر أو البحث بكلمات أخرى")}</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold text-[var(--muted)] mb-4">
            {T("{total} وظيفة متاحة", { total })}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>

          {/* الترقيم */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] px-4 py-2 rounded-xl">
                {T("الصفحة {page} من {totalPages}", { page, totalPages })}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="h-40 bg-[var(--surface)] animate-pulse rounded-2xl" />
      <div className="h-32 bg-[var(--surface)] animate-pulse rounded-2xl" />
      <div className="grid grid-cols-2 gap-5">
        <div className="h-56 bg-[var(--surface)] animate-pulse rounded-2xl" />
        <div className="h-56 bg-[var(--surface)] animate-pulse rounded-2xl" />
      </div>
    </div>}>
      <JobsPageInner />
    </Suspense>
  );
}
