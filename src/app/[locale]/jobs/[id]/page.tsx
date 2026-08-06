"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import {
  MapPin,
  Clock,
  Banknote,
  Building2,
  CalendarDays,
  GraduationCap,
  Briefcase,
  Users,
  Eye,
  Phone,
  Mail,
  Globe,
  User as UserIcon,
  Layers,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { JobItem } from "@/lib/jobTypes";

// تحميل كسول لنافذة التقديم — لا تُعرض إلا عند ضغط المستخدم على زر التقديم
const ApplyModal = dynamic(() => import("@/components/ApplyModal"), { ssr: false });

function formatDate(value: string | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "professional" | "employer";
};

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [job, setJob] = useState<JobItem | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        // صفحة تفاصيل الوظيفة متاحة للمهنيين فقط
        if (!d.user || d.user.role !== "professional") {
          router.push("/login");
          return;
        }
        setUser(d.user);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/jobs/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.job) {
          setNotFound(true);
          return;
        }
        setJob(d.job);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    fetch(`/api/applications?jobId=${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.data)) setAlreadyApplied(d.data.length > 0);
      })
      .catch(() => setAlreadyApplied(false))
      .finally(() => setCheckingApplied(false));
  }, [id, user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-48 bg-[var(--surface)] animate-pulse rounded-2xl" />
        <div className="h-64 bg-[var(--surface)] animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-black text-[var(--foreground)]">الوظيفة غير موجودة</h1>
        <p className="text-sm text-[var(--muted)] mt-2">قد تكون حُذفت أو أن الرابط غير صحيح.</p>
        <button onClick={() => router.push("/jobs")} className="mt-6 bg-[var(--primary)] text-white font-bold px-6 py-3 rounded-xl transition hover:bg-[var(--primary-dark)]">
          العودة إلى الوظائف
        </button>
      </div>
    );
  }

  const infoItems = [
    { icon: GraduationCap, label: "المؤهل العلمي", value: job.education },
    { icon: Briefcase, label: "سنوات الخبرة", value: job.experienceYears },
    { icon: Layers, label: "القسم / التخصص", value: job.department },
    { icon: Clock, label: "نوع الدوام", value: job.workType },
    { icon: Building2, label: "نوع الوظيفة", value: job.jobType },
    { icon: Users, label: "عدد الوظائف المطلوبة", value: String(job.vacancies) },
    { icon: UserIcon, label: "الجنس", value: job.gender || "لا يهم" },
    { icon: CalendarDays, label: "آخر موعد للتقديم", value: formatDate(job.deadline) },
  ];

  if (job.ageFrom || job.ageTo) {
    infoItems.push({
      icon: UserIcon,
      label: "العمر",
      value: `${job.ageFrom || "—"} - ${job.ageTo || "—"} سنة`,
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* البانر */}
      {job.banner && (
        <div className="relative h-48 md:h-60 rounded-2xl overflow-hidden mb-6 card-shadow">
          <Image src={job.banner} alt={job.jobTitle} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* رأس الوظيفة */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Link
            href={`/company/${job.companyId}`}
            className="w-20 h-20 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex items-center justify-center hover:border-[var(--primary)] transition-colors"
            title="ملف الشركة"
          >
            {job.companyLogo ? (
              <Image src={job.companyLogo} alt={job.companyName} width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-9 h-9 text-[var(--muted)]" />
            )}
          </Link>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${job.status === "open" ? "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25" : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"}`}>
                {job.status === "open" ? "🟢 مفتوح للتقديم" : "🔴 مغلق"}
              </span>
              <span className="text-[11px] font-bold text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-full">
                تم النشر: {formatDate(job.createdAt)}
              </span>
              <span className="text-[11px] font-bold text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <Eye className="w-3 h-3" /> {job.views} مشاهدة
              </span>
              <span className="text-[11px] font-bold text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <Users className="w-3 h-3" /> {job.applicationsCount} متقدم
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{job.jobTitle}</h1>
            <Link
              href={`/company/${job.companyId}`}
              className="inline-block text-[var(--muted)] font-bold mt-1 hover:text-[var(--primary)] transition-colors"
              title={`عرض ملف شركة ${job.companyName}`}
            >
              {job.companyName} ←
            </Link>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]">
                <MapPin className="w-4 h-4 text-[var(--primary)]" /> {job.city} — {job.governorate}، {job.country}
              </span>
              {job.salary && (
                <span className="inline-flex items-center gap-1.5 text-sm font-black text-[var(--primary)]">
                  <Banknote className="w-4 h-4" /> {job.salary}
                  {job.salaryType ? ` ${job.salaryType}` : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* زر التقديم الكبير */}
        <div className="mt-6 pt-6 border-t border-[var(--border)]">
          {alreadyApplied ? (
            <div className="flex items-center justify-center gap-2 bg-[var(--success)]/15 border border-[var(--success)]/25 text-[var(--success)] font-bold py-4 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
              لقد تقدمت لهذه الوظيفة مسبقاً — سنبلغك عند اتخاذ القرار
            </div>
          ) : checkingApplied ? (
            <button disabled className="w-full flex items-center justify-center gap-2 bg-[var(--surface)] text-[var(--muted)] font-bold py-4 rounded-2xl">
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري التحقق...
            </button>
          ) : job.status === "open" ? (
            <button
              onClick={() => setApplyOpen(true)}
              className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] hover:opacity-95 text-white text-lg font-black py-4 rounded-2xl shadow-lg shadow-[var(--primary)]/20 transition active:scale-[0.99]"
            >
              <Send className="w-6 h-6" />
              التقديم على الوظيفة
            </button>
          ) : (
            <div className="text-center bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] font-bold py-4 rounded-2xl">
              هذا الإعلان الوظيفي مغلق حالياً
            </div>
          )}
        </div>
      </div>

      {/* وصف الوظيفة */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8 mb-6">
        <h2 className="text-lg font-black text-[var(--foreground)] mb-4">📋 وصف الوظيفة</h2>
        <p className="text-[var(--muted)] leading-loose text-sm md:text-base whitespace-pre-line">{job.description}</p>
      </div>

      {/* المهارات المطلوبة */}
      {job.skills.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8 mb-6">
          <h2 className="text-lg font-black text-[var(--foreground)] mb-4">🛠️ المهارات المطلوبة</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span key={skill} className="bg-[var(--primary)]/5 text-[var(--primary)] border border-[var(--primary)]/15 px-3.5 py-1.5 rounded-full text-sm font-semibold">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* بيانات الوظيفة */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8 mb-6">
        <h2 className="text-lg font-black text-[var(--foreground)] mb-5">📌 تفاصيل الوظيفة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {infoItems.map((item) => (
            <div key={item.label} className="flex items-start gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5">
              <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
                <item.icon className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--muted)] font-bold">{item.label}</p>
                <p className="text-sm font-bold text-[var(--foreground)] truncate">{item.value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* المزايا */}
      {job.benefits && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8 mb-6">
          <h2 className="text-lg font-black text-[var(--foreground)] mb-4">🎁 مزايا الوظيفة</h2>
          <p className="text-[var(--muted)] leading-loose text-sm md:text-base whitespace-pre-line">{job.benefits}</p>
        </div>
      )}

      {/* بيانات التواصل */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8">
        <h2 className="text-lg font-black text-[var(--foreground)] mb-4">📞 بيانات التواصل مع الشركة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5">
            <Phone className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span className="text-sm font-bold text-[var(--foreground)]" dir="ltr">{job.contactPhone}</span>
          </div>
          <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5">
            <Mail className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span className="text-sm font-bold text-[var(--foreground)] truncate" dir="ltr">{job.contactEmail}</span>
          </div>
          <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5">
            <Globe className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span className="text-sm font-bold text-[var(--foreground)] truncate">{job.website || "—"}</span>
          </div>
        </div>
      </div>

      <ApplyModal
        key={applyOpen ? "open" : "closed"}
        jobId={job._id}
        jobTitle={job.jobTitle}
        companyName={job.companyName}
        prefilledName={user?.name}
        prefilledEmail={user?.email}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
      />
    </div>
  );
}
