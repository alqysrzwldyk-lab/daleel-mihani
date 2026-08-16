"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Tag,
  Eye,
  MessageSquare,
  Phone,
  Share2,
  Heart,
  Flag,
  Calendar,
  Zap,
  Clock,
  User as UserIcon,
  Star,
  Briefcase,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  ExternalLink,
  ShieldAlert,
  MessagesSquare,
  BadgeCheck,
  EyeOff,
  UserX,
} from "lucide-react";
import RatingStars from "@/components/RatingStars";
import AdStatusBadge from "@/components/AdStatusBadge";
import { getProfessionArabic } from "@/lib/professions";
import { useT } from "@/lib/useT";
import type { TranslateVars } from "@/i18n/translate";

const CURRENCY_SYMBOLS: Record<string, string> = {
  YER: "﷼",
  SAR: "﷼",
  USD: "$",
};

const CATEGORY_LABELS: Record<string, string> = {
  cars: "سيارات ومركبات",
  lands: "أراضي وعقارات",
  electronics: "أجهزة وإلكترونيات",
  furniture: "أثاث",
  "home-tools": "أدوات منزلية",
  weapons: "سلاح وذخائر",
  services: "خدمات صيانة",
  programming: "برمجة وتقنية",
  accounting: "محاسبة واستشارات",
  design: "تصميم",
  teaching: "تدريس",
  other: "أخرى",
};

const REPORT_REASONS = [
  "إعلان احتيالي",
  "محتوى مخالف",
  "بيع سلعة محظورة",
  "معلومات مضللة",
  "أخرى",
];

const USER_REPORT_REASONS = [
  "احتيال أو نصب",
  "مضايقة أو سلوك مسيء",
  "معلومات مضللة",
  "انتحال شخصية",
  "محتوى مخالف",
  "أخرى",
];

type AdDetail = {
  _id: string;
  adNumber?: string;
  type: string;
  category: string;
  title: string;
  description: string;
  price?: number | null;
  currency?: string;
  location: string;
  images?: string[];
  specifications?: Record<string, string>;
  status: string;
  views: number;
  contactCount: number;
  sharesCount: number;
  favoritesCount: number;
  createdAt?: string;
  userId?: string;
};

type Seller = {
  userId: string;
  name: string;
  avatar: string | null;
  role: string;
  hasProfile: boolean;
  profession: string | null;
  averageRating: number;
  ratingCount: number;
  experienceYears: string | null;
  phone: string | null;
  whatsapp: string | null;
  activeAdsCount: number;
};

type AuthUser = {
  id: string;
  role: string;
};

type RelatedAd = {
  _id: string;
  title: string;
  description: string;
  price?: number | null;
  currency?: string;
  location: string;
  images?: string[];
  verified?: boolean;
  boosted?: boolean;
  seller?: { name?: string; avatar?: string | null; averageRating?: number; ratingCount?: number };
};

function toDigits(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

function timeAgo(date: string | undefined, T: (s: string, vars?: TranslateVars) => string): string {
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

export default function AdDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const T = useT();

  const [ad, setAd] = useState<AdDetail | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [boosted, setBoosted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(false);

  const [related, setRelated] = useState<RelatedAd[]>([]);

  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const [hidden, setHidden] = useState(false);
  const [hideBusy, setHideBusy] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [userReportOpen, setUserReportOpen] = useState(false);
  const [userReportReason, setUserReportReason] = useState("");
  const [userReportNote, setUserReportNote] = useState("");
  const [userReported, setUserReported] = useState(false);

  const [copied, setCopied] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [ratingOpen, setRatingOpen] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/ads/${id}/rate`)
      .then((r) => r.json())
      .then((d) => {
        if (d.myRating) {
          setMyRating(d.myRating.score);
          setRatingComment(d.myRating.comment || "");
          setRated(true);
        }
      })
      .catch(() => {});
  }, [user, id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/ads/${id}/hide`)
      .then((r) => r.json())
      .then((d) => { if (d.isHidden) setHidden(true); })
      .catch(() => {});
  }, [user, id]);

  useEffect(() => {
    if (!user?.id || !seller?.userId) return;
    fetch(`/api/users/${seller.userId}/block`)
      .then((r) => r.json())
      .then((d) => { if (d.isBlocked) setIsBlocked(true); })
      .catch(() => {});
  }, [user, seller]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/ads/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.success) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setAd(d.ad);
        setSeller(d.seller || null);
        setBoosted(!!d.boosted);
        setIsFavorite(!!d.isFavorite);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/${id}/related`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.related) setRelated(d.related);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton h-80 rounded-xl mb-4" />
        <div className="skeleton h-40 rounded-xl" />
      </div>
    );
  }

  if (notFound || !ad) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <ShieldAlert />
          <h3>{T("الإعلان غير موجود")}</h3>
          <p>{T("ربما تم حذف الإعلان أو أنه غير متاح")}</p>
          <Link href="/ads" className="btn btn-primary mt-3">{T("العودة إلى الإعلانات")}</Link>
        </div>
      </div>
    );
  }

  const isOwner = !!user && !!seller && user.id === seller.userId;
  const images = ad.images && ad.images.length > 0 ? ad.images : [];
  const symbol = CURRENCY_SYMBOLS[ad.currency || "YER"] || "﷼";
  const isNew = (() => {
    if (!ad.createdAt) return false;
    return Date.now() - new Date(ad.createdAt).getTime() < 7 * 86400000;
  })();
  const whatsappHref = seller?.whatsapp
    ? `https://wa.me/${toDigits(seller.whatsapp)}?text=${encodeURIComponent(T('مرحباً، أنا مهتم بإعلانك "{title}"', { title: ad.title }))}`
    : null;

  async function handleMessage() {
    if (!user) {
      router.push("/login");
      return;
    }
    setMessageOpen(true);
  }

  async function submitMessage() {
    if (!seller || !ad) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: seller.userId,
          content: messageText.trim() || T('أنا مهتم بـ "{title}"', { title: ad.title }),
          refType: "ad",
          refId: ad._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/messages/${data.conversationId}`);
        return;
      }
      alert(data.error ? T(data.error) : T("فشل إرسال الرسالة"));
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setSending(false);
    }
  }

  async function handleFavorite() {
    if (!ad) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setFavLoading(true);
    try {
      const res = await fetch(`/api/ads/${ad._id}/favorite`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsFavorite(!!data.isFavorite);
        setAd((prev) =>
          prev
            ? {
                ...prev,
                favoritesCount: Math.max(0, (prev.favoritesCount || 0) + (data.isFavorite ? 1 : -1)),
              }
            : prev
        );
      } else {
        alert(data.error ? T(data.error) : T("فشل تحديث المفضلة"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setFavLoading(false);
    }
  }

  async function handleShare() {
    if (!ad) return;
    const url = window.location.href;
    const title = T("إعلان: {title}", { title: ad.title });
    try {
      if (navigator.share) {
        await navigator.share({ title, text: ad.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
    fetch(`/api/ads/${ad._id}/share`, { method: "POST" }).catch(() => {});
  }

  async function toggleHide() {
    if (!ad) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setHideBusy(true);
    try {
      const res = await fetch(`/api/ads/${ad._id}/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hide: !hidden }),
      });
      const data = await res.json();
      if (res.ok) {
        setHidden(!!data.isHidden);
      } else {
        alert(data.error ? T(data.error) : T("فشل تحديث الإخفاء"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setHideBusy(false);
    }
  }

  async function toggleBlock() {
    if (!seller) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!confirm(isBlocked ? T("إلغاء حظر هذا البائع؟") : T("حظر هذا البائع؟ ستختفي جميع إعلاناته من نتائجك."))) return;
    setBlockBusy(true);
    try {
      const res = await fetch(`/api/users/${seller.userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block: !isBlocked }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsBlocked(!!data.isBlocked);
      } else {
        alert(data.error ? T(data.error) : T("فشل تحديث الحظر"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setBlockBusy(false);
    }
  }

  async function submitUserReport() {
    if (!seller) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!userReportReason) {
      alert(T("يرجى اختيار سبب البلاغ"));
      return;
    }
    setReporting(true);
    try {
      const res = await fetch(`/api/users/${seller.userId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: userReportReason, note: userReportNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserReported(true);
      } else {
        alert(data.error ? T(data.error) : T("فشل إرسال البلاغ"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setReporting(false);
    }
  }

  async function submitRating() {
    if (!ad) return;
    if (!myRating) {
      alert(T("يرجى اختيار عدد النجوم"));
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/ads/${ad._id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: myRating, comment: ratingComment }),
      });
      const data = await res.json();
      if (res.ok) {
        setRated(true);
        setSeller((prev) =>
          prev
            ? {
                ...prev,
                averageRating: data.averageRating ?? prev.averageRating,
                ratingCount: data.ratingCount ?? prev.ratingCount,
              }
            : prev
        );
      } else {
        alert(data.error ? T(data.error) : T("فشل إرسال التقييم"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setSubmittingRating(false);
    }
  }

  async function submitReport() {
    if (!ad) return;
    if (!reportReason) {
      alert(T("يرجى اختيار سبب البلاغ"));
      return;
    }
    setReporting(true);
    try {
      const res = await fetch(`/api/ads/${ad._id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, note: reportNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setReported(true);
      } else {
        alert(data.error ? T(data.error) : T("فشل إرسال البلاغ"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setReporting(false);
    }
  }

  const specificationsEntries = ad.specifications ? Object.entries(ad.specifications) : [];

  return (
    <div className="page-container">
      <button onClick={() => router.back()} className="back-btn mb-4">
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* معرض الصور */}
      <div className="app-card overflow-hidden mb-4">
        {images.length > 0 ? (
          <>
            <div className="relative bg-slate-900 aspect-[4/3]">
              <button
                className="w-full h-full cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={images[currentImage]}
                  alt={ad.title}
                  className="w-full h-full object-contain"
                />
              </button>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImage((i) => (i - 1 + images.length) % images.length)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((i) => (i + 1) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {currentImage + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto hide-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                      i === currentImage
                        ? "border-primary"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-64 bg-slate-100 flex items-center justify-center">
            <Tag className="w-10 h-10 text-slate-300" />
          </div>
        )}
      </div>

      {/* الشارات */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`badge ${ad.type === "professional" ? "badge-primary" : "badge-warning"}`}>
          {ad.type === "professional" ? T("خدمة مهنية") : T("إعلان تجاري")}
        </span>
        <span className="badge bg-[var(--border-light)] text-[var(--muted)] border border-[var(--border)]">
          {T(CATEGORY_LABELS[ad.category] || ad.category)}
        </span>
        {isNew && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold border border-sky-200">
            <Clock className="w-3 h-3" /> {T("جديد")}
          </span>
        )}
        {boosted && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200">
            <Zap className="w-3 h-3" /> {T("معزز")}
          </span>
        )}
        <AdStatusBadge status={ad.status} />
      </div>

      {/* العنوان والسعر */}
      <div className="app-card p-5 mb-4">
        <h1 className="text-xl font-extrabold leading-relaxed">{ad.title}</h1>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <span className="text-2xl font-extrabold text-primary">
            {ad.price ? `${ad.price.toLocaleString()} ${symbol}` : T("حسب الاتفاق")}
          </span>
          <span className="text-xs text-muted-light">{T("رقم الإعلان: {adNumber}", { adNumber: ad.adNumber || ad._id.slice(-6).toUpperCase() })}</span>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border-light)] text-xs text-muted flex-wrap">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" /> {ad.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" /> {timeAgo(ad.createdAt, T)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-primary" /> {T("{count} مشاهدة", { count: ad.views || 0 })}
          </span>
          <span className="flex items-center gap-1.5">
            <MessagesSquare className="w-4 h-4 text-primary" /> {T("{count} تواصل", { count: ad.contactCount || 0 })}
          </span>
        </div>
      </div>

      {/* الوصف والمواصفات */}
      <div className="app-card p-5 mb-4">
        <h2 className="font-bold text-base mb-3">{T("تفاصيل الإعلان")}</h2>
        <p className="text-sm text-[var(--muted)] leading-loose whitespace-pre-line">
          {ad.description}
        </p>

        {specificationsEntries.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {specificationsEntries.map(([key, value]) => (
              <div key={key} className="bg-[var(--surface)] rounded-lg px-3 py-2 text-xs">
                <span className="text-muted-light block">{key}</span>
                <span className="font-bold text-[var(--foreground)]">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* إجراءات الإعلان */}
      <div className="app-card p-5 mb-4">
        <h2 className="font-bold text-sm mb-4">{T("إجراءات سريعة")}</h2>
        {isOwner ? (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-sky-700 mb-3">{T("هذا إعلانك الخاص")}</p>
            <Link href="/dashboard/my-ads" className="btn btn-primary">
              {T("إدارة إعلاناتي")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={handleMessage}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] font-bold text-xs hover:bg-[var(--primary)]/5 transition active:scale-[0.97]"
            >
              <MessageSquare className="w-5 h-5" />
              {T("مراسلة")}
            </button>

            {seller?.phone ? (
              <a
                href={`tel:${seller.phone}`}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-bold text-xs hover:border-[var(--primary)] hover:text-[var(--primary)] transition active:scale-[0.97]"
              >
                <Phone className="w-5 h-5" />
                {T("اتصال")}
              </a>
            ) : (
              <span className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-[var(--border)] text-[var(--muted-light)] font-bold text-xs opacity-50 cursor-not-allowed">
                <Phone className="w-5 h-5" />
                {T("اتصال")}
              </span>
            )}

            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition active:scale-[0.97]"
              >
                <MessagesSquare className="w-5 h-5" />
                {T("واتساب")}
              </a>
            ) : (
              <span className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-[var(--border)] text-[var(--muted-light)] font-bold text-xs opacity-50 cursor-not-allowed">
                <MessagesSquare className="w-5 h-5" />
                {T("واتساب")}
              </span>
            )}

            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-bold text-xs hover:border-[var(--primary)] hover:text-[var(--primary)] transition active:scale-[0.97]"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
              {copied ? T("تم النسخ") : T("مشاركة")}
            </button>

            <button
              onClick={handleFavorite}
              disabled={favLoading}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border font-bold text-xs transition active:scale-[0.97] ${
                isFavorite
                  ? "border-rose-300 bg-rose-50 text-rose-600"
                  : "border-[var(--border)] text-[var(--foreground)] hover:border-rose-300 hover:text-rose-600"
              }`}
            >
              {favLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
              )}
              {isFavorite ? T("محفوظ") : T("حفظ")}
            </button>

            <button
              onClick={() => {
                if (!user) {
                  router.push("/login");
                  return;
                }
                setReportOpen(true);
              }}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] font-bold text-xs hover:border-amber-300 hover:text-amber-600 transition active:scale-[0.97]"
            >
              <Flag className="w-5 h-5" />
              {T("إبلاغ")}
            </button>

            <button
              onClick={toggleHide}
              disabled={hideBusy}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border font-bold text-xs transition active:scale-[0.97] ${
                hidden
                  ? "border-slate-300 bg-slate-100 text-slate-500"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-slate-400 hover:text-slate-600"
              }`}
            >
              {hideBusy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
              {hidden ? T("مخفي") : T("إخفاء")}
            </button>
          </div>
        )}
      </div>

      {/* بطاقة البائع */}
      {seller && (
        <div className="app-card p-5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
              {seller.avatar ? (
                <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6 text-[var(--muted-light)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold truncate">{seller.name}</p>
              <p className="text-xs text-muted truncate">
                {seller.profession ? T(getProfessionArabic(seller.profession)) : T("بائع")}{" "}
                {seller.experienceYears && T("• خبرة {years}", { years: seller.experienceYears })}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <RatingStars rating={seller.averageRating} size="sm" />
                <span className="text-[11px] text-muted-light">
                  ({T("{count} تقييم", { count: seller.ratingCount > 0 ? seller.ratingCount : 0 })})
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-[var(--surface)] rounded-lg px-3 py-2 text-center">
              <p className="font-extrabold text-base">{seller.activeAdsCount}</p>
              <p className="text-[10px] text-muted-light">{T("إعلان نشط")}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-lg px-3 py-2 text-center">
              <p className="font-extrabold text-base">
                {seller.experienceYears ? `${seller.experienceYears}` : "-"}
              </p>
              <p className="text-[10px] text-muted-light">{T("سنوات خبرة")}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-lg px-3 py-2 text-center">
              <p className="font-extrabold text-base">{seller.averageRating?.toFixed(1) || "-"}</p>
              <p className="text-[10px] text-muted-light">{T("التقييم")}</p>
            </div>
          </div>

          {/* تقييم البائع بعد التعامل */}
          {!isOwner && (
            <div className="mt-4 rounded-xl border border-[var(--border)] p-4">
              {rated ? (
                <div className="text-center py-1">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${s <= (myRating || 0) ? "fill-amber-400 text-amber-400" : "text-[var(--border)]"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-emerald-600">{T("شكراً لتقييمك هذا البائع")}</p>
                  {ratingComment && <p className="text-[11px] text-muted mt-1">"{ratingComment}"</p>}
                  <button
                    onClick={() => setRatingOpen(true)}
                    className="text-[11px] font-bold text-primary hover:underline mt-2"
                  >
                    {T("تعديل تقييمك")}
                  </button>
                </div>
              ) : ratingOpen ? (
                <>
                  <p className="text-xs font-bold mb-2">{T("قيّم البائع بعد التعامل")}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setMyRating(s)}
                        className="transition active:scale-90"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= (myRating || 0) ? "fill-amber-400 text-amber-400" : "text-[var(--border)]"
                          }`}
                        />
                      </button>
                    ))}
                    {myRating && (
                      <span className="text-xs font-extrabold text-amber-500 ms-1">{myRating}/5</span>
                    )}
                  </div>
                  <input
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder={T("أضف تعليقاً (اختياري)")}
                    maxLength={500}
                    className="input-field w-full text-sm"
                  />
                  <button
                    onClick={submitRating}
                    disabled={submittingRating}
                    className="btn btn-primary btn-block mt-3"
                  >
                    {submittingRating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : T("إرسال التقييم")}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setRatingOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs hover:bg-amber-100 transition"
                >
                  <Star className="w-4 h-4" />
                  {T("قيّم البائع بعد التعامل")}
                </button>
              )}
            </div>
          )}

          {!isOwner && (
            <>
              <div className="grid grid-cols-3 gap-2 mt-4">
              {seller.hasProfile ? (
                <Link
                  href={`/professionals/${seller.userId}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/30 text-[var(--primary)] font-bold text-xs hover:bg-[var(--primary)]/10 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {T("الملف")}
                </Link>
              ) : (
                <span className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-light)] font-bold text-xs">
                  <Briefcase className="w-3.5 h-3.5" />
                  {T("بلا ملف")}
                </span>
              )}
              <button
                onClick={handleMessage}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] font-bold text-xs hover:bg-[var(--primary)]/5 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {T("مراسلة")}
              </button>
              {seller.phone ? (
                <a
                  href={`tel:${seller.phone}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-bold text-xs hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {T("اتصال")}
                </a>
              ) : (
                <span className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-light)] font-bold text-xs opacity-50">
                  <Phone className="w-3.5 h-3.5" />
                  {T("اتصال")}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={toggleBlock}
                disabled={blockBusy}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-bold text-xs transition ${
                  isBlocked
                    ? "border-slate-300 bg-slate-100 text-slate-500"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-red-300 hover:text-red-600"
                }`}
              >
                {blockBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserX className="w-3.5 h-3.5" />
                )}
                {isBlocked ? T("إلغاء الحظر") : T("حظر البائع")}
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  setUserReportOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] font-bold text-xs hover:border-amber-300 hover:text-amber-600 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                {T("الإبلاغ عن المستخدم")}
              </button>
            </div>
            </>
          )}
        </div>
      )}

      {/* اقتراحات ذكية: إعلانات مشابهة */}
      {related.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="font-extrabold text-base">{T("قد يعجبك أيضاً")}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {related.map((r) => {
              const rSymbol = CURRENCY_SYMBOLS[r.currency || "YER"] || "﷼";
              return (
                <Link
                  key={r._id}
                  href={`/ads/${r._id}`}
                  className="app-card overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="relative h-28 bg-slate-100">
                    {r.images && r.images[0] ? (
                      <img
                        src={r.images[0]}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                    {r.boosted && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold shadow">
                        ⚡
                      </span>
                    )}
                    {r.verified && (
                      <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow">
                        <BadgeCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-xs font-bold line-clamp-1">{r.title}</h4>
                    <p className="text-[10px] text-muted line-clamp-1 mt-0.5">{r.location}</p>
                    <p className="text-xs font-extrabold text-primary mt-1.5">
                      {r.price && r.price > 0 ? `${r.price.toLocaleString()} ${rSymbol}` : T("حسب الاتفاق")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* نافذة المراسلة */}
      {messageOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="app-card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold">{T("مراسلة {name}", { name: seller?.name || T("البائع") })}</h3>
              <button onClick={() => setMessageOpen(false)} className="text-[var(--muted-light)] hover:text-[var(--foreground)] transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              placeholder={T('أنا مهتم بـ "{title}"...', { title: ad.title })}
              className="input-field resize-none"
            />
            <button
              onClick={submitMessage}
              disabled={sending}
              className="btn btn-primary btn-block mt-4"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : T("إرسال الرسالة")}
            </button>
          </div>
        </div>
      )}

      {/* نافذة الإبلاغ */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="app-card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-500" /> {T("الإبلاغ عن الإعلان")}
              </h3>
              <button onClick={() => setReportOpen(false)} className="text-[var(--muted-light)] hover:text-[var(--foreground)] transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reported ? (
              <div className="text-center py-4">
                <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm">{T("تم استلام بلاغك")}</p>
                <p className="text-xs text-muted mt-1">{T("شكراً لمساهمتك في سلامة المنصة")}</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setReportReason(reason)}
                      className={`w-full text-right px-4 py-2.5 rounded-xl border text-sm font-bold transition ${
                        reportReason === reason
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-[var(--border)] text-[var(--foreground)] hover:border-amber-300"
                      }`}
                    >
                      {T(reason)}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  rows={2}
                  placeholder={T("تفاصيل إضافية (اختياري)")}
                  className="input-field resize-none mt-3"
                />
                <button
                  onClick={submitReport}
                  disabled={reporting}
                  className="btn btn-primary btn-block mt-4"
                >
                  {reporting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : T("إرسال البلاغ")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* نافذة الإبلاغ عن المستخدم */}
      {userReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="app-card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-500" /> {T("الإبلاغ عن {name}", { name: seller?.name || T("المستخدم") })}
              </h3>
              <button onClick={() => setUserReportOpen(false)} className="text-[var(--muted-light)] hover:text-[var(--foreground)] transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {userReported ? (
              <div className="text-center py-4">
                <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm">{T("تم استلام بلاغك")}</p>
                <p className="text-xs text-muted mt-1">{T("سيراجع فريقنا هذا المستخدم")}</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {USER_REPORT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setUserReportReason(reason)}
                      className={`w-full text-right px-4 py-2.5 rounded-xl border text-sm font-bold transition ${
                        userReportReason === reason
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-[var(--border)] text-[var(--foreground)] hover:border-amber-300"
                      }`}
                    >
                      {T(reason)}
                    </button>
                  ))}
                </div>
                <textarea
                  value={userReportNote}
                  onChange={(e) => setUserReportNote(e.target.value)}
                  rows={2}
                  placeholder={T("تفاصيل إضافية (اختياري)")}
                  className="input-field resize-none mt-3"
                />
                <button
                  onClick={submitUserReport}
                  disabled={reporting}
                  className="btn btn-primary btn-block mt-4"
                >
                  {reporting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : T("إرسال البلاغ")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* معرض ملء الشاشة */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-bold">
              {currentImage + 1} / {images.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom((z) => !z)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <Zap className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setLightboxOpen(false);
                  setZoom(false);
                }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative overflow-auto flex items-center justify-center">
            <img
              src={images[currentImage]}
              alt={ad.title}
              className={`transition-transform duration-200 ${zoom ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"}`}
              onClick={() => setZoom((z) => !z)}
              style={{ maxHeight: "80vh" }}
            />
          </div>

          {images.length > 1 && (
            <div className="p-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentImage((i) => (i - 1 + images.length) % images.length)}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentImage((i) => (i + 1) % images.length)}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
