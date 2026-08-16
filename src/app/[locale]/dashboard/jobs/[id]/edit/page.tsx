"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import JobForm from "@/components/JobForm";
import type { JobItem } from "@/lib/jobTypes";
import { useT } from "@/lib/useT";

export default function EditJobPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const T = useT();

  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "employer") {
          router.push("/login");
          return;
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/jobs/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.job) {
          setError("الإعلان غير موجود أو أنك لا تملك صلاحية تعديله");
          return;
        }
        setJob(d.job);
      })
      .catch(() => setError("فشل تحميل بيانات الإعلان"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center gap-3 text-[var(--muted)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        <span className="text-sm font-bold">{T("جاري تحميل الإعلان...")}</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-xl font-black text-[var(--foreground)]">{T(error) || T("الإعلان غير موجود")}</h1>
        <button onClick={() => router.push("/dashboard/jobs")} className="mt-6 bg-[var(--primary)] text-white font-bold px-6 py-3 rounded-xl transition hover:bg-[var(--primary-dark)]">
          {T("العودة إلى إعلاناتي")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.push("/dashboard/jobs")} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition mb-5">
        <ArrowRight className="w-4 h-4" />
        {T("العودة إلى إعلاناتي")}
      </button>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{T("تعديل الإعلان الوظيفي")}</h1>
        <p className="text-sm text-[var(--muted)] mt-1.5">{T("عدّل تفاصيل الوظيفة ثم احفظ التغييرات لتحديث الإعلان مباشرة.")}</p>
      </div>

      <JobForm mode="edit" jobId={job._id} initialData={job} />
    </div>
  );
}
