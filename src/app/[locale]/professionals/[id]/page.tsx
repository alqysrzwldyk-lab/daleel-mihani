"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useT } from "@/lib/useT";
import { MapPin, Mail, Phone, Briefcase, ArrowLeft, Star, Building2, MessageSquare, Pencil, Trash2, ChevronDown, Loader2, Tag } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import ProfessionalActions from "@/components/ProfessionalActions";
import AdEditModal from "@/components/AdEditModal";
import AdStatusBadge, { type AdStatus } from "@/components/AdStatusBadge";
import type { ProfessionalPublic } from "@/lib/api";
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

export default function ProfessionalProfilePage() {
  const t = useTranslations("profile");
  const T = useT();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [professional, setProfessional] = useState<(ProfessionalPublic & { userRating?: number }) | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rated, setRated] = useState(false);

  // ─── قسم إعلانات المهني ───
  const [ads, setAds] = useState<ProfileAd[] | null>(null);
  const [editingAd, setEditingAd] = useState<ProfileAd | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

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

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/professionals/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setProfessional(d);
        if (d.userRating) {
          setRating(d.userRating);
          setRated(true);
        }
      });
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
      // جلب البيانات من جديد لعرض التقييم الجديد ضمن قائمة التقييمات
      const fresh = await fetch(`/api/professionals/${id}`).then((r) => r.json());
      setProfessional(fresh);
    }
  }

  // ─── إدارة إعلانات الملف ───
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

  if (!professional) {
    return (
      <div className="page-container">
        <div className="skeleton h-64 rounded-xl mb-4" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  const profs = professional.professions?.length ? professional.professions : [professional.profession || "other"];
  const isOwner = !!user && !!professional && user.id === professional.userId;

  return (
    <div className="page-container">
      <button onClick={() => router.back()} className="back-btn mb-4">
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="app-card overflow-hidden">
        <div className="h-32 bg-gradient-to-l from-blue-600 via-blue-500 to-sky-400 relative">
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
            <h1 className="text-2xl font-bold">{professional.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {profs.map((p, i) => (
                <span key={p} className="text-primary font-semibold text-sm">
                  {getProfessionIcon(p)} {T(getProfessionArabic(p))}
                  {i < profs.length - 1 && <span className="text-muted-light mx-1">|</span>}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <RatingStars rating={professional.averageRating} />
              <span className="text-xs text-muted">
                ({professional.ratingCount} {T("تقييم")})
              </span>
            </div>

            {professional.location && (
              <p className="flex items-center gap-1.5 text-sm text-muted mt-2">
                <MapPin className="w-4 h-4" /> {professional.location}
              </p>
            )}
          </div>

          {professional.bio && (
            <div className="mt-5">
              <h2 className="font-bold text-sm mb-2">{t("about")}</h2>
              <p className="text-sm text-muted leading-relaxed">{professional.bio}</p>
            </div>
          )}

          {professional.skills?.length > 0 && (
            <div className="mt-5">
              <h2 className="font-bold text-sm mb-3">{t("skills")}</h2>
              <div className="flex flex-wrap gap-2">
                {professional.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

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
                  <span className="text-[11px] text-muted-light">{timeAgo(review.createdAt, T)}</span>
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
