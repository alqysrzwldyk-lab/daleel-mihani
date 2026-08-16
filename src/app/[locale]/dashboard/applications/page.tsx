"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileDown,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  CheckCircle,
  XCircle,
  MessageSquare,
  RotateCcw,
  Clock,
} from "lucide-react";
import type { JobApplicationItem, ApplicationStatus } from "@/lib/jobTypes";
import { useT } from "@/lib/useT";

function formatDate(value: string | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_META: Record<ApplicationStatus, { label: string; classes: string }> = {
  pending: { label: "قيد المراجعة", classes: "bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/25" },
  accepted: { label: "تم القبول", classes: "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25" },
  rejected: { label: "مرفوض", classes: "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/25" },
};

function ApplicationsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";
  const T = useT();

  const [apps, setApps] = useState<JobApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [expandedId, setExpandedId] = useState("");
  const [busyId, setBusyId] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [messageId, setMessageId] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "employer") {
          router.push("/login");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    const url = jobId ? `/api/applications?jobId=${jobId}` : "/api/applications";
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setApps(d.data || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [authorized, jobId]);

  async function changeStatus(app: JobApplicationItem, status: ApplicationStatus) {
    if (busyId) return;
    setBusyId(app._id);
    try {
      const res = await fetch(`/api/applications/${app._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setApps((prev) => prev.map((a) => (a._id === app._id ? { ...a, status } : a)));
      } else {
        alert(data.error ? T(data.error) : T("حدث خطأ أثناء تحديث الحالة"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setBusyId("");
    }
  }

  async function sendMessage(app: JobApplicationItem) {
    const message = messageDraft.trim();
    if (message.length < 2) return;
    setBusyId(app._id);
    try {
      const res = await fetch(`/api/applications/${app._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessageId("");
        setMessageDraft("");
        setApps((prev) => prev.map((a) => (a._id === app._id ? { ...a, companyNote: message } : a)));
      } else {
        alert(data.error ? T(data.error) : T("حدث خطأ أثناء إرسال الرسالة"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setBusyId("");
    }
  }

  if (!authorized) return null;

  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] flex items-center gap-3">
          <Users className="w-7 h-7 text-[var(--primary)]" />
          {T("طلبات التوظيف")}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1.5">
          {T("عرض المتقدمين على وظائفك، تحميل السير الذاتية، قبول أو رفض الطلبات، ومراسلة المتقدمين.")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs font-bold text-[var(--foreground)]">
          {T("إجمالي الطلبات: {count}", { count: apps.length })}
        </span>
        <span className="bg-[var(--warning)]/15 border border-[var(--warning)]/25 rounded-xl px-4 py-2 text-xs font-bold text-[var(--warning)]">
          {T("قيد المراجعة: {count}", { count: pendingCount })}
        </span>
        {jobId && (
          <button onClick={() => { setLoading(true); router.push("/dashboard/applications"); }} className="inline-flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition">
            <RotateCcw className="w-3.5 h-3.5" /> {T("عرض كل الطلبات")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-24 gap-3 text-[var(--muted)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <span className="text-sm font-bold">{T("جاري تحميل الطلبات...")}</span>
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--card)]">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="font-black text-lg text-[var(--foreground)]">{T("لا توجد طلبات توظيف بعد")}</h3>
          <p className="text-sm text-[var(--muted)] mt-2">{T("عندما يتقدم مهنيون على وظائفك ستظهر طلباتهم هنا.")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const meta = STATUS_META[app.status];
            const expanded = expandedId === app._id;
            return (
              <div key={app._id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow overflow-hidden">
                <button onClick={() => setExpandedId(expanded ? "" : app._id)} className="w-full p-5 text-right hover:bg-[var(--surface)]/50 transition flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-black text-[var(--foreground)] text-lg">{app.fullName}</h3>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${meta.classes}`}>{T(meta.label)}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {app.profession} ← {app.jobTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-[var(--muted)] font-bold inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDate(app.createdAt)}
                    </span>
                    {expanded ? <ChevronUp className="w-5 h-5 text-[var(--muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--muted)]" />}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-[var(--border)] p-5 space-y-5 animate-in fade-in duration-200 bg-[var(--surface)]/30">
                    {/* بيانات المتقدم */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
                        <Phone className="w-4 h-4 text-[var(--primary)] shrink-0" />
                        <span className="text-sm font-bold text-[var(--foreground)]" dir="ltr">{app.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
                        <Mail className="w-4 h-4 text-[var(--primary)] shrink-0" />
                        <span className="text-sm font-bold text-[var(--foreground)] truncate" dir="ltr">{app.email}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
                        <Briefcase className="w-4 h-4 text-[var(--primary)] shrink-0" />
                        <span className="text-sm font-bold text-[var(--foreground)]">{T("المهنة: {profession}", { profession: app.profession })}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
                        <GraduationCap className="w-4 h-4 text-[var(--primary)] shrink-0" />
                        <span className="text-sm font-bold text-[var(--foreground)]">{T("المؤهل: {education} — خبرة {experience}", { education: app.education, experience: app.experience })}</span>
                      </div>
                    </div>

                    {/* الرسالة التعريفية */}
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                      <p className="text-[11px] font-bold text-[var(--muted)] mb-1.5">{T("الرسالة التعريفية")}</p>
                      <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">{app.coverLetter}</p>
                    </div>

                    {/* ملاحظة الشركة */}
                    {app.companyNote && (
                      <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl p-4">
                        <p className="text-[11px] font-bold text-[var(--primary)] mb-1.5">{T("رسالتك السابقة إلى المتقدم")}</p>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">{app.companyNote}</p>
                      </div>
                    )}

                    {/* الإجراءات */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {app.cvFile && (
                        <a
                          href={app.cvFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] text-xs font-bold px-4 py-2.5 rounded-xl hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                        >
                          <FileDown className="w-3.5 h-3.5" /> {T("تحميل السيرة الذاتية")}
                        </a>
                      )}
                      <button
                        onClick={() => changeStatus(app, "accepted")}
                        disabled={busyId === app._id}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                      >
                        {busyId === app._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} {T("قبول الطلب")}
                      </button>
                      <button
                        onClick={() => changeStatus(app, "rejected")}
                        disabled={busyId === app._id}
                        className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {T("رفض الطلب")}
                      </button>
                      {app.status !== "pending" && (
                        <button
                          onClick={() => changeStatus(app, "pending")}
                          disabled={busyId === app._id}
                          className="inline-flex items-center gap-1.5 bg-[var(--warning)]/20 hover:bg-[var(--warning)]/30 text-[var(--warning)] text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> {T("إعادة للحالة المعلقة")}
                        </button>
                      )}
                    </div>

                    {/* إرسال رسالة */}
                    <div className="border-t border-[var(--border)] pt-4">
                      {messageId === app._id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={messageDraft}
                            onChange={(e) => setMessageDraft(e.target.value)}
                            placeholder={T("اكتب رسالتك إلى المتقدم هنا...")}
                            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)] resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => sendMessage(app)}
                              disabled={busyId === app._id || messageDraft.trim().length < 2}
                              className="inline-flex items-center gap-1.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                            >
                              {busyId === app._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />} {T("إرسال الرسالة")}
                            </button>
                            <button onClick={() => { setMessageId(""); setMessageDraft(""); }} className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] text-xs font-bold rounded-xl transition">
                              {T("إلغاء")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setMessageId(app._id); setMessageDraft(""); }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-dark)] transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> {T("إرسال رسالة للمتقدم")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8"><div className="h-24 bg-[var(--surface)] animate-pulse rounded-2xl mb-6" /><div className="h-96 bg-[var(--surface)] animate-pulse rounded-2xl" /></div>}>
      <ApplicationsInner />
    </Suspense>
  );
}
