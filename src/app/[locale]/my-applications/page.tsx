"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Send, Loader2, CalendarDays, ExternalLink } from "lucide-react";
import type { JobApplicationItem, ApplicationStatus } from "@/lib/jobTypes";
import { useT } from "@/lib/useT";

function formatDate(value: string | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

const STATUS_META: Record<ApplicationStatus, { label: string; icon: string; classes: string }> = {
  pending: { label: "قيد المراجعة", icon: "⏳", classes: "bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/25" },
  accepted: { label: "تم القبول", icon: "🎉", classes: "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25" },
  rejected: { label: "مرفوض", icon: "😔", classes: "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/25" },
};

export default function MyApplicationsPage() {
  const T = useT();
  const router = useRouter();
  const [apps, setApps] = useState<JobApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "professional") {
          router.push("/login");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    fetch("/api/applications", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setApps(d.data || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [authorized]);

  const accepted = apps.filter((a) => a.status === "accepted").length;
  const pending = apps.filter((a) => a.status === "pending").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] flex items-center gap-3">
          <Send className="w-7 h-7 text-[var(--primary)]" />
          {T("طلباتي المقدمة")}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1.5">{T("متابعة حالة طلبات التقديم التي أرسلتها على الوظائف.")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs font-bold text-[var(--foreground)]">{T("إجمالي الطلبات: {count}", { count: apps.length })}</span>
        <span className="bg-[var(--success)]/15 border border-[var(--success)]/25 rounded-xl px-4 py-2 text-xs font-bold text-[var(--success)]">{T("مقبولة: {count}", { count: accepted })}</span>
        <span className="bg-[var(--warning)]/15 border border-[var(--warning)]/25 rounded-xl px-4 py-2 text-xs font-bold text-[var(--warning)]">{T("قيد المراجعة: {count}", { count: pending })}</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-24 gap-3 text-[var(--muted)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <span className="text-sm font-bold">{T("جاري تحميل طلباتك...")}</span>
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--card)]">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-black text-lg text-[var(--foreground)]">{T("لم تتقدم على أي وظيفة بعد")}</h3>
          <p className="text-sm text-[var(--muted)] mt-2 mb-6">{T("تصفح فرص العمل المتاحة وقدّم على ما يناسب مهاراتك.")}</p>
          <Link href="/jobs" className="inline-flex items-center gap-2 bg-[var(--primary)] text-white font-bold px-6 py-3 rounded-xl transition hover:bg-[var(--primary-dark)]">
            {T("تصفح الوظائف")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const meta = STATUS_META[app.status];
            return (
              <div key={app._id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-black text-lg text-[var(--foreground)] truncate">{app.jobTitle}</h3>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${meta.classes}`}>{meta.icon} {T(meta.label)}</span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{app.companyName}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)] font-bold mt-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> {T("قدّمت بتاريخ: {date}", { date: formatDate(app.createdAt) })}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {app.companyNote && (
                    <span className="hidden md:inline-block max-w-56 truncate text-[11px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl px-3 py-2">
                      💬 {app.companyNote}
                    </span>
                  )}
                  <Link href={`/jobs/${app.jobId}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] border border-[var(--primary)]/20 bg-[var(--primary)]/5 hover:bg-[var(--primary)] hover:text-white px-4 py-2.5 rounded-xl transition">
                    <ExternalLink className="w-3.5 h-3.5" /> {T("عرض الوظيفة")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
