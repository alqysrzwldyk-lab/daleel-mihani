"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useT } from "@/lib/useT";
import {
  MapPin,
  Mail,
  Phone,
  Briefcase,
  ArrowLeft,
  Star,
  Building2,
  MessageSquare,
  Pencil,
  Trash2,
  ChevronDown,
  Loader2,
  Tag,
  BadgeCheck,
  GraduationCap,
  Globe,
  Languages,
  Clock,
  FolderKanban,
  Award,
  Target,
  Play,
  FileText,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
} from "lucide-react";
import RatingStars from "@/components/RatingStars";
import ProfessionalActions from "@/components/ProfessionalActions";
import AdEditModal from "@/components/AdEditModal";
import AdStatusBadge, { type AdStatus } from "@/components/AdStatusBadge";
import type { ProfessionalDetails } from "@/lib/professional";
import { getProfessionArabic, getProfessionIcon } from "@/lib/professions";

const PROFILE_STATUS_OPTIONS: { value: AdStatus; label: string }[] = [
  { value: "active", label: "متوفر" },
  { value: "coming_soon", label: "قريباً" },
  { value: "reserved", label: "محجوز" },
  { value: "sold", label: "تم البيع" },
  { value: "expired", label: "منتهي" },
  { value: "paused", label: "موقوف مؤقتاً" },
];

type AuthUser = {
  id: string;
  role: "professional" | "employer";
};

type ProfileAd = {
  _id: string;
  type: "professional" | "general";
  category: string;
  title: string;
  description: string;
  price?: number | null;
  currency?: string;
  location: string;
  status: AdStatus;
  specifications?: Record<string, string>;
  images?: string[];
  createdAt?: string;
  views?: number;
};

const AVAILABILITY_META: Record<string, { label: string; cls: string; icon: string }> = {
  available: { label: "متوفر للعمل", cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: "🟢" },
  busy: { label: "مشغول حالياً", cls: "bg-amber-50 text-amber-600 border-amber-200", icon: "🟠" },
  away: { label: "غير متاح", cls: "bg-slate-100 text-slate-500 border-slate-200", icon: "⚪" },
};

function timeAgo(date: string | undefined, T: (s: string, vars?: Record<string, string | number>) => string): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours <= 0) return T("الآن");
    return T("منذ {hours} ساعة", { hours });
  }
  if (days === 1) return T("منذ يوم");
  if (days < 7) return T("منذ {days} أيام", { days });
  const months = Math.floor(days / 30);
  if (months < 12) return T("منذ {months} شهر", { months });
  return T("منذ {years} سنة", { years: Math.floor(months / 12) });
}

function socialUrl(type: string, value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handles: Record<string, string> = {
    whatsapp: `https://wa.me/${v.replace(/[^0-9]/g, "")}`,
    telegram: `https://t.me/${v.replace(/^@/, "")}`,
    facebook: `https://facebook.com/${v}`,
    instagram: `https://instagram.com/${v}`,
    linkedin: `https://linkedin.com/in/${v}`,
    github: `https://github.com/${v}`,
    twitter: `https://x.com/${v}`,
    website: v,
  };
  return handles[type] || v;
}

export default function ProfessionalProfile({
  professional: initial,
}: {
  professional: ProfessionalDetails;
}) {
  const t = useTranslations("profile");
  const T = useT();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [professional, setProfessional] = useState<ProfessionalDetails>(initial);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rating, setRating] = useState(initial.userRating || 0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rated, setRated] = useState(!!initial.userRating);

  const [ads, setAds] = useState<ProfileAd[] | null>(null);
  const [editingAd, setEditingAd] = useState<ProfileAd | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

  useEffect(() => {
    fetch(`/api/professionals/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d._id) setProfessional(d);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/professionals/${id}/ads`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setAds(d.ads || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleRate(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;

    setSubmitting(true);
    const res = await fetch(`/api/professionals/${id}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: rating, comment }),
    });

    setSubmitting(false);

    if (res.ok) {
      setRated(true);
      const fresh = await fetch(`/api/professionals/${id}`).then((r) => r.json());
      if (fresh && fresh._id) setProfessional(fresh);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(T(data.error || "حدث خطأ"));
    }
  }

  const handleDeleteAd = async (ad: ProfileAd) => {
    if (!confirm(T("هل أنت متأكد من حذف هذا الإعلان؟"))) return;
    setActionId(ad._id);
    try {
      const res = await fetch(`/api/ads/${ad._id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setAds((prev) => (prev ? prev.filter((a) => a._id !== ad._id) : prev));
      } else {
        alert(T(data.error || "حدث خطأ"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setActionId(null);
    }
  };

  const handleChangeAdStatus = async (ad: ProfileAd, newStatus: AdStatus) => {
    if (newStatus === ad.status) return;
    setActionId(ad._id);
    try {
      const res = await fetch(`/api/ads/${ad._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setAds((prev) =>
          prev ? prev.map((a) => (a._id === ad._id ? { ...a, status: newStatus } : a)) : prev
        );
      } else {
        alert(T(data.error || "حدث خطأ"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setActionId(null);
    }
  };

  const profs = professional.professions?.length
    ? professional.professions
    : [professional.profession || "other"];
  const isOwner = !!user && !!professional && user.id === professional.userId;

  // ─── مؤشر اكتمال الملف ───
  const completion = useMemo(() => {
    const checks = [
      professional.photo,
      professional.cover,
      professional.bio,
      professional.specialization,
      professional.objective,
      professional.education,
      professional.phone,
      professional.location,
      professional.projects?.length,
      professional.certificates?.length,
      professional.skillLevels?.length,
      professional.languages?.length,
      professional.workExperience?.length,
      professional.workingHours?.hours,
      professional.social && Object.keys(professional.social).length,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [professional]);

  const socials = professional.social || {};
  const skillLevels = professional.skillLevels || [];
  const languages = professional.languages || [];
  const projects = professional.projects || [];
  const certificates = professional.certificates || [];

  return (
    <div className="page-container">
      <button onClick={() => router.back()} className="back-btn mb-4">
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="app-card overflow-hidden">
        <div className="relative h-40 bg-gradient-to-l from-blue-600 via-blue-500 to-sky-400">
          {professional.cover ? (
            <Image
              src={professional.cover}
              alt={professional.name}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          ) : null}
          <div className="absolute -bottom-12 right-6 w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-slate-200 shadow-xl">
            {professional.photo ? (
              <Image src={professional.photo} alt={professional.name} width={96} height={96} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100">{getProfessionIcon(profs[0])}</div>
            )}
          </div>
        </div>

        <div className="pt-14 px-5 pb-5">
          <div className="text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{professional.name}</h1>
              {professional.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
                  <BadgeCheck className="w-4 h-4" />
                  {T("موثق")}
                </span>
              )}
              {professional.availability && AVAILABILITY_META[professional.availability] && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                    AVAILABILITY_META[professional.availability].cls
                  }`}
                >
                  {AVAILABILITY_META[professional.availability].icon} {T(AVAILABILITY_META[professional.availability].label)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {profs.map((p, i) => (
                <span key={p} className="text-primary font-semibold text-sm">
                  {getProfessionIcon(p)} {T(getProfessionArabic(p))}
                  {i < profs.length - 1 && <span className="text-muted-light mx-1">|</span>}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <RatingStars rating={professional.averageRating} />
              <span className="text-xs text-muted">
                ({professional.ratingCount} {T("تقييم")})
              </span>
              {professional.completedJobs > 0 && (
                <span className="text-xs font-bold text-sky-600 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {professional.completedJobs} {T("عمل مكتمل")}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted">
              {professional.location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(professional.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-[var(--primary)] transition"
                >
                  <MapPin className="w-4 h-4" /> {professional.location}
                </a>
              )}
              {professional.experienceYears && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" /> {professional.experienceYears} {T("خبرة")}
                </span>
              )}
              {professional.currentWorkplace && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> {professional.currentWorkplace}
                </span>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between text-xs font-bold text-muted mb-1.5">
                <span>{T("اكتمال الملف")}</span>
                <span className="text-primary">{completion}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] rounded-full transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
              {completion < 100 && (
                <p className="text-[11px] text-muted-light mt-1.5">
                  {T("أكمل بياناتك لزيادة فرص الظهور أمام أصحاب الشركات")}
                </p>
              )}
            </div>
          )}

          {professional.objective && (
            <div className="mt-5 bg-primary/5 border border-primary/15 rounded-xl p-4">
              <h2 className="flex items-center gap-1.5 font-bold text-sm mb-2 text-[var(--primary)]">
                <Target className="w-4 h-4" /> {T("الهدف المهني")}
              </h2>
              <p className="text-sm text-muted leading-relaxed">{professional.objective}</p>
            </div>
          )}

          {professional.bio && (
            <div className="mt-5">
              <h2 className="font-bold text-sm mb-2">{t("about")}</h2>
              <p className="text-sm text-muted leading-relaxed">{professional.bio}</p>
            </div>
          )}

          {/* المهارات ومستوياتها */}
          {(professional.skills?.length > 0 || skillLevels.length > 0) && (
            <div className="mt-5">
              <h2 className="font-bold text-sm mb-3">{t("skills")}</h2>
              {skillLevels.length > 0 && (
                <div className="space-y-2.5 mb-3">
                  {skillLevels.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-32 truncate shrink-0">{s.skill}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] rounded-full"
                          style={{ width: `${Math.max(5, Math.min(100, s.level))}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary w-10 text-center shrink-0">{s.level}%</span>
                    </div>
                  ))}
                </div>
              )}
              {professional.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {professional.skills.map((skill) => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* اللغات */}
          {languages.length > 0 && (
            <div className="mt-5">
              <h2 className="flex items-center gap-1.5 font-bold text-sm mb-3">
                <Languages className="w-4 h-4 text-[var(--primary)]" /> {T("اللغات")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {languages.map((l, i) => (
                  <span key={i} className="chip active">
                    {l.name}
                    {l.level && <span className="text-muted text-[10px] ms-1">({T(l.level)})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* المؤهل والتعليم */}
          {professional.education && (
            <div className="mt-5">
              <h2 className="flex items-center gap-1.5 font-bold text-sm mb-2">
                <GraduationCap className="w-4 h-4 text-[var(--primary)]" /> {T("المؤهل العلمي")}
              </h2>
              <p className="text-sm text-muted">{professional.education}</p>
            </div>
          )}

          {/* الخبرة العملية */}
          {professional.workExperience?.length > 0 && (
            <div className="mt-5">
              <h2 className="font-bold text-sm mb-3">{t("workHistory")}</h2>
              <div className="space-y-3">
                {professional.workExperience.map((exp, i) => (
                  <div key={i} className="border-s-[3px] border-primary ps-4 py-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{exp.position}</span>
                      <span className="text-xs text-muted">— {exp.company}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {exp.startDate} {exp.endDate ? `→ ${exp.endDate}` : `→ ${T("حتى الآن")}`}
                    </p>
                    {exp.description && <p className="text-xs text-muted mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* المعرض / المشاريع */}
          {projects.length > 0 && (
            <div className="mt-5">
              <h2 className="flex items-center gap-1.5 font-bold text-sm mb-3">
                <FolderKanban className="w-4 h-4 text-[var(--primary)]" /> {T("المشاريع")} ({projects.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((p, i) => (
                  <div key={i} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
                    {p.image && (
                      <div className="relative h-36 bg-slate-100">
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="p-3">
                      <h4 className="text-sm font-bold">{p.title}</h4>
                      {p.category && <p className="text-[11px] text-[var(--primary)] font-bold mt-0.5">{p.category}</p>}
                      {p.completedDate && <p className="text-[11px] text-muted-light mt-0.5">{T("تاريخ الإنجاز")}: {p.completedDate}</p>}
                      {p.description && <p className="text-xs text-muted mt-1.5 leading-relaxed">{p.description}</p>}
                      {(p.images?.length || p.video || p.pdf || p.beforeAfter?.after) && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.video && (
                            <a href={p.video} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg">
                              <Play className="w-3 h-3" /> {T("فيديو")}
                            </a>
                          )}
                          {p.pdf && (
                            <a href={p.pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-sky-600 px-2 py-1 rounded-lg">
                              <FileText className="w-3 h-3" /> PDF
                            </a>
                          )}
                          {p.beforeAfter?.after && (
                            <a href={p.beforeAfter.after} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                              <ImagePlus className="w-3 h-3" /> {T("قبل / بعد")}
                            </a>
                          )}
                          {p.images?.map((img, j) => (
                            <a key={j} href={img} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                              {T("صورة")} {j + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الشهادات */}
          {certificates.length > 0 && (
            <div className="mt-5">
              <h2 className="flex items-center gap-1.5 font-bold text-sm mb-3">
                <Award className="w-4 h-4 text-[var(--primary)]" /> {T("الشهادات")} ({certificates.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certificates.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 border border-[var(--border)] rounded-xl p-3 bg-[var(--surface)]">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Award className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{c.name}</p>
                      {c.organization && <p className="text-[11px] text-muted">{c.organization}</p>}
                      <p className="text-[11px] text-muted-light">
                        {c.issueDate && `${T("تاريخ الإصدار")}: ${c.issueDate}`}
                        {c.expiryDate && ` • ${T("الانتهاء")}: ${c.expiryDate}`}
                      </p>
                      {c.pdf && (
                        <a href={c.pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 mt-1">
                          <FileText className="w-3 h-3" /> {T("عرض الشهادة")}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* أوقات العمل */}
          {professional.workingHours && (
            <div className="mt-5">
              <h2 className="flex items-center gap-1.5 font-bold text-sm mb-2">
                <Clock className="w-4 h-4 text-[var(--primary)]" /> {T("أوقات العمل")}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {professional.workingHours.days?.map((d) => (
                  <span key={d} className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-muted">{T(d)}</span>
                ))}
              </div>
              {professional.workingHours.hours && (
                <p className="text-sm text-muted mt-2">{professional.workingHours.hours}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {professional.workingHours.availableNow && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {T("متاح للعمل الآن")}
                  </span>
                )}
                {professional.workingHours.emergencyAvailable && (
                  <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    {T("متاح للحالات الطارئة")}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* روابط التواصل */}
          {Object.values(socials).some((v) => v?.trim()) && (
            <div className="mt-5">
              <h2 className="flex items-center gap-1.5 font-bold text-sm mb-3">
                <Globe className="w-4 h-4 text-[var(--primary)]" /> {T("روابط التواصل")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(socials)
                  .filter(([, v]) => v?.trim())
                  .map(([type, value]) => (
                    <a
                      key={type}
                      href={socialUrl(type, value!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/5 border border-[var(--primary)]/20 px-3 py-1.5 rounded-xl hover:bg-[var(--primary)]/10 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {type === "website" ? T("الموقع الإلكتروني") : T(type === "whatsapp" ? "واتساب" : type === "telegram" ? "تيليجرام" : type)}
                    </a>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-5 bg-slate-50 rounded-xl p-4">
            <h2 className="font-bold text-sm mb-3">{t("contact")}</h2>
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-primary" /> {professional.email}
            </p>
            {professional.phone && (
              <p className="flex items-center gap-2 text-sm mt-2">
                <Phone className="w-4 h-4 text-primary" /> {professional.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* إعلانات المهني */}
      {ads && ads.length > 0 && (
        <div className="app-card p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">
              {isOwner ? T("إعلاناتي") : T("إعلانات {name}", { name: professional.name })}
            </h2>
            <span className="text-xs text-muted-light bg-[var(--border-light)] px-2 py-0.5 rounded-full">
              {ads.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ads.map((ad) => {
              const symbol = ad.currency === "USD" ? "$" : "﷼";
              return (
                <div key={ad._id} className="app-card overflow-hidden">
                  {ad.images?.[0] && (
                    <Link href={`/ads/${ad._id}`} className="block relative h-32 bg-slate-100">
                      <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-700">
                        {ad.type === "professional" ? T("💼 خدمة مهنية") : T("📦 إعلان تجاري")}
                      </span>
                      {ad.status !== "active" && (
                        <span className="absolute top-2 left-2">
                          <AdStatusBadge status={ad.status} />
                        </span>
                      )}
                    </Link>
                  )}
                  <div className="p-3">
                    <Link href={`/ads/${ad._id}`}>
                      <h4 className="text-sm font-bold line-clamp-1 hover:text-primary transition">{ad.title}</h4>
                    </Link>
                    <p className="text-[11px] text-muted-light mt-1 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-0.5">
                        <Tag className="w-3 h-3" /> {ad.price ? `${ad.price.toLocaleString()} ${symbol}` : T("حسب الاتفاق")}
                      </span>
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {ad.location}</span>
                    </p>
                    {isOwner && (
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => setEditingAd(ad)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg text-[11px] font-bold transition"
                        >
                          <Pencil className="w-3.5 h-3.5" /> {T("تعديل")}
                        </button>
                        <div className="relative flex-1 flex items-center justify-center py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg">
                          <ChevronDown className="w-3.5 h-3.5 pointer-events-none" />
                          <select
                            value={ad.status}
                            disabled={actionId === ad._id}
                            onChange={(e) => handleChangeAdStatus(ad, e.target.value as AdStatus)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:opacity-30"
                            title={T("تغيير حالة الإعلان")}
                          >
                            {PROFILE_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{T(opt.label)}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleDeleteAd(ad)}
                          disabled={actionId === ad._id}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-bold transition disabled:opacity-50"
                        >
                          {actionId === ad._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          {T("حذف")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="app-card p-5 mt-4">
        <h2 className="font-bold text-sm mb-4">{t("rateThis")}</h2>

        {!user || user.role !== "employer" ? (
          <p className="text-muted text-sm">{t("loginToRate")}</p>
        ) : rated ? (
          <div>
            <p className="text-success text-sm mb-2">{t("alreadyRated")}</p>
            <RatingStars rating={rating} interactive value={rating} />
          </div>
        ) : (
          <form onSubmit={handleRate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("yourRating")}</label>
              <RatingStars rating={0} interactive value={rating} onChange={setRating} size="lg" />
            </div>
            <div className="input-group">
              <label className="input-label">{t("comment")}</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <button type="submit" disabled={!rating || submitting} className="btn btn-primary btn-block">
              {submitting ? "..." : t("submitRating")}
            </button>
          </form>
        )}
      </div>

      <div className="mt-4">
        <ProfessionalActions professional={professional} user={user} />
      </div>

      {professional.ratingCount > 0 && (
        <div className="app-card p-5 mt-4">
          <h2 className="font-bold text-sm mb-4">{t("reviewsTitle")}</h2>

          {professional.ratingDistribution && (
            <div className="space-y-1.5 mb-5">
              {[5, 4, 3, 2, 1].map((level) => {
                const count = professional.ratingDistribution?.[level as keyof typeof professional.ratingDistribution] || 0;
                const pct = professional.ratingCount > 0 ? Math.round((count / professional.ratingCount) * 100) : 0;
                return (
                  <div key={level} className="flex items-center gap-2 text-xs">
                    <span className="w-6 flex items-center gap-0.5 font-bold text-slate-600">
                      {level} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-muted text-left">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            {(professional.reviews || []).map((review) => (
              <div key={review._id} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{review.reviewerName}</p>
                    <RatingStars rating={review.score} size="sm" />
                  </div>
                  <span className="text-[11px] text-muted-light">{timeAgo(review.createdAt?.toString(), T)}</span>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-light mt-0.5 flex-shrink-0" />
                    {review.comment}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-light">{T("بدون تعليق")}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {editingAd && (
        <AdEditModal
          ad={editingAd}
          onClose={() => setEditingAd(null)}
          onSaved={(updated) =>
            setAds((prev) =>
              prev ? prev.map((a) => (a._id === updated._id ? { ...a, ...updated } : a)) : prev
            )
          }
        />
      )}
    </div>
  );
}
