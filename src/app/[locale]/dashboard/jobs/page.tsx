"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  Plus,
  Trash2,
  Pencil,
  Users,
  Eye,
  Briefcase,
  Loader2,
  CalendarDays,
} from "lucide-react";
import type { JobItem } from "@/lib/jobTypes";

function formatDate(value: string | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

export default function CompanyJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "employer") {
          router.push("/login");
          return;
        }
        setCompanyId(d.company?.id || d.company?._id || "");
        setAuthorized(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!authorized || !companyId) return;
    fetch(`/api/jobs?companyId=${companyId}&includeClosed=1&limit=50`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setJobs(d.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [authorized, companyId]);

  async function handleDelete(job: JobItem) {
    if (!confirm(`هل أنت متأكد من حذف إعلان "${job.jobTitle}" وكل طلبات التقديم المرتبطة به؟`)) return;
    const res = await fetch(`/api/jobs/${job._id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setJobs((prev) => prev.filter((j) => j._id !== job._id));
    } else {
      alert(data.error || "حدث خطأ أثناء الحذف");
    }
  }

  async function toggleStatus(job: JobItem) {
    const next = job.status === "open" ? "closed" : "open";
    const res = await fetch(`/api/jobs/${job._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json();
    if (res.ok) {
      setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, status: next } : j)));
    } else {
      alert(data.error || "حدث خطأ أثناء تحديث الحالة");
    }
  }

  if (!authorized) return null;

  const openCount = jobs.filter((j) => j.status === "open").length;
  const totalApplications = jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* الترويسة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-[var(--primary)]" />
            إعلاناتي الوظيفية
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1.5">إدارة إعلانات التوظيف الخاصة بشركتك ومتابعة المتقدمين عليها.</p>
        </div>
        <Link href="/dashboard/jobs/new" className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold px-5 py-3 rounded-xl transition shadow-md shadow-[var(--primary)]/10 active:scale-95 shrink-0">
          <Plus className="w-4 h-4" />
          إضافة إعلان وظيفي
        </Link>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl"><Briefcase className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-black text-[var(--foreground)]">{jobs.length}</p>
            <p className="text-xs font-bold text-[var(--muted)]">إجمالي الإعلانات</p>
          </div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-[var(--success)]/15 text-[var(--success)] rounded-xl"><Eye className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-black text-[var(--foreground)]">{openCount}</p>
            <p className="text-xs font-bold text-[var(--muted)]">إعلانات مفتوحة</p>
          </div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl"><Users className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-black text-[var(--foreground)]">{totalApplications}</p>
            <p className="text-xs font-bold text-[var(--muted)]">إجمالي المتقدمين</p>
          </div>
        </div>
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="flex flex-col items-center py-24 gap-3 text-[var(--muted)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <span className="text-sm font-bold">جاري تحميل إعلاناتك...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--card)]">
          <div className="text-5xl mb-4">💼</div>
          <h3 className="font-black text-lg text-[var(--foreground)]">لا توجد إعلانات وظيفية بعد</h3>
          <p className="text-sm text-[var(--muted)] mt-2 mb-6">ابدأ بنشر أول إعلان وظيفي لتستقبل طلبات المهنيين المناسبين.</p>
          <Link href="/dashboard/jobs/new" className="inline-flex items-center gap-2 bg-[var(--primary)] text-white font-bold px-6 py-3 rounded-xl transition hover:bg-[var(--primary-dark)]">
            <Plus className="w-4 h-4" /> إضافة إعلان وظيفي
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job._id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-[var(--primary)] transition">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${job.status === "open" ? "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25" : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"}`}>
                    {job.status === "open" ? "🟢 مفتوح" : "🔴 مغلق"}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-0.5 rounded-full">
                    {job.department}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {formatDate(job.createdAt)}
                  </span>
                </div>
                <h3 className="font-black text-lg text-[var(--foreground)] truncate">{job.jobTitle}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-[var(--muted)] font-bold">
                  <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {job.applicationsCount} متقدم</span>
                  <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {job.views} مشاهدة</span>
                  <span>{job.city}</span>
                  {job.salary && <span className="text-[var(--primary)]">{job.salary}{job.salaryType ? ` ${job.salaryType}` : ""}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 md:shrink-0 flex-wrap">
                <Link
                  href={`/dashboard/applications?jobId=${job._id}`}
                  className="inline-flex items-center gap-1.5 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)] hover:text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition"
                >
                  <Users className="w-3.5 h-3.5" /> المتقدمين
                </Link>
                <button
                  onClick={() => toggleStatus(job)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl border transition ${job.status === "open" ? "bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/25 hover:bg-[var(--danger)]/25" : "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/25 hover:bg-[var(--success)]/25"}`}
                >
                  {job.status === "open" ? "إغلاق" : "فتح"}
                </button>
                <Link
                  href={`/dashboard/jobs/${job._id}/edit`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                >
                  <Pencil className="w-3.5 h-3.5" /> تعديل
                </Link>
                <button
                  onClick={() => handleDelete(job)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/25 hover:bg-[var(--danger)]/25 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
