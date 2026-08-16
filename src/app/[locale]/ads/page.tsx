"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, MapPin, Search, Megaphone, MessageSquare, ChevronLeft, Eye, Clock, Camera, SlidersHorizontal, BadgeCheck, Heart } from "lucide-react";
import JobCard from "@/components/JobCard";
import RatingStars from "@/components/RatingStars";
import AdStatusBadge from "@/components/AdStatusBadge";
import type { JobItem } from "@/lib/jobTypes";
import { useT } from "@/lib/useT";
import type { TranslateVars } from "@/i18n/translate";

type AdItem = {
  _id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  location: string;
  images?: string[];
  createdAt?: string;
  views?: number;
  boosted?: boolean;
  verified?: boolean;
  status?: string;
  seller?: {
    name?: string;
    avatar?: string | null;
    averageRating?: number;
    ratingCount?: number;
  };
};

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

const CATEGORY_ICONS: Record<string, string> = {
  cars: "🚗",
  lands: "🏠",
  electronics: "📱",
  furniture: "🛋️",
  "home-tools": "🔧",
  weapons: "🔫",
  services: "🛠️",
  programming: "💻",
  accounting: "📊",
  design: "🎨",
  teaching: "📚",
  other: "📦",
};

type TabType = "all" | "general" | "professional";

type Filters = {
  status: string;
  category: string;
  location: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  verified: boolean;
  newOnly: boolean;
  boostedOnly: boolean;
  sort: string;
};

const DEFAULT_FILTERS: Filters = {
  status: "all",
  category: "all",
  location: "",
  minPrice: "",
  maxPrice: "",
  minRating: "0",
  verified: false,
  newOnly: false,
  boostedOnly: false,
  sort: "new",
};

const RATING_OPTIONS = [
  { value: "0", label: "كل التقييمات" },
  { value: "3", label: "3 نجوم فأكثر" },
  { value: "4", label: "4 نجوم فأكثر" },
  { value: "5", label: "5 نجوم" },
];

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

export default function AdsPage() {
  const T = useT();
  const [ads, setAds] = useState<AdItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    fetch("/api/jobs?limit=6")
      .then((r) => r.json())
      .then((d) => { if (d.data) setJobs(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.location) params.set("location", filters.location);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (Number(filters.minRating) > 0) params.set("minRating", filters.minRating);
    if (filters.verified) params.set("verified", "1");
    if (filters.newOnly) params.set("newOnly", "1");
    if (filters.boostedOnly) params.set("boostedOnly", "1");
    if (filters.sort !== "new") params.set("sort", filters.sort);
    const qs = params.toString();

    fetch(`/api/ads/public${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setAds(d.ads || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const filtered = ads.filter((ad) => {
    if (activeTab === "general" && ad.type !== "general") return false;
    if (activeTab === "professional" && ad.type !== "professional") return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !ad.title.toLowerCase().includes(q) &&
        !ad.description.toLowerCase().includes(q) &&
        !ad.location.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const grouped: Record<string, AdItem[]> = {};
  for (const ad of filtered) {
    const cat = ad.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ad);
  }

  const generalCategories: string[] = [];
  const professionalCategories: string[] = [];
  for (const cat of Object.keys(grouped)) {
    const isPro = grouped[cat].some((a) => a.type === "professional");
    if (isPro && grouped[cat].every((a) => a.type === "professional")) {
      professionalCategories.push(cat);
    } else {
      generalCategories.push(cat);
    }
  }
  generalCategories.sort((a, b) => grouped[b].length - grouped[a].length);
  professionalCategories.sort((a, b) => grouped[b].length - grouped[a].length);

  function AdCard({ ad }: { ad: AdItem }) {
    const symbol = CURRENCY_SYMBOLS[ad.currency || "YER"] || "﷼";
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [favBusy, setFavBusy] = useState(false);

    const isNew = ad.createdAt ? Date.now() - new Date(ad.createdAt).getTime() < 7 * 86400000 : false;
    const imageCount = ad.images?.length || 0;
    const rating = ad.seller?.averageRating || 0;

    async function handleToggleFavorite() {
      if (favBusy) return;
      setFavBusy(true);
      try {
        const res = await fetch(`/api/ads/${ad._id}/favorite`, {
          method: favorited ? "DELETE" : "POST",
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setFavorited(data.isFavorite);
        } else {
          const data = await res.json();
          alert(data.error ? T(data.error) : T("حدث خطأ"));
        }
      } catch {
        alert(T("فشل الاتصال"));
      }
      setFavBusy(false);
    }

    async function handleContact() {
      setSending(true);
      try {
        const res = await fetch("/api/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId: ad._id, message: T('أنا مهتم بـ "{title}"', { title: ad.title }) }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.conversationId) {
            window.location.href = `/messages/${data.conversationId}`;
            return;
          }
          setSent(true);
        } else {
          alert(data.error ? T(data.error) : T("حدث خطأ"));
        }
      } catch {
        alert(T("فشل الاتصال"));
      }
      setSending(false);
    }

    return (
      <div className="app-card flex flex-col justify-between overflow-hidden">
        {ad.images && ad.images.length > 0 && ad.images[0] && (
          <Link href={`/ads/${ad._id}`} className="relative w-full h-40 bg-slate-100 block group">
            <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute top-2 right-2 flex flex-col gap-1.5">
              {ad.boosted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold shadow">
                  {T("⚡ معزز")}
                </span>
              )}
              {ad.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-extrabold shadow">
                  <BadgeCheck className="w-3 h-3" /> {T("موثق")}
                </span>
              )}
              {isNew && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-extrabold shadow">
                  <Clock className="w-3 h-3" /> {T("جديد")}
                </span>
              )}
              {ad.status && ad.status !== "active" && (
                <AdStatusBadge status={ad.status} />
              )}
            </div>
            {imageCount > 1 && (
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                <Camera className="w-3 h-3" /> {imageCount}
              </span>
            )}
            {ad.price != null && ad.price > 0 && (
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-white/95 text-primary font-extrabold text-sm shadow">
                {ad.price.toLocaleString()} {symbol}
              </span>
            )}
          </Link>
        )}
        <div className="p-3 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`badge ${ad.type === "professional" ? "badge-primary" : "badge-warning"}`}>
                {ad.type === "professional" ? T("خدمة مهنية") : T("إعلان تجاري")}
              </span>
              <span className="text-[11px] text-muted-light flex items-center gap-0.5">
                <MapPin className="w-3 h-3" /> {ad.location}
              </span>
              <span className="ms-auto text-[11px] text-muted-light flex items-center gap-0.5">
                <Eye className="w-3 h-3" /> {ad.views || 0}
              </span>
            </div>
            <Link href={`/ads/${ad._id}`}>
              <h4 className="text-sm font-bold mb-1 line-clamp-1 hover:text-primary transition">{ad.title}</h4>
            </Link>
            <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-2">{ad.description}</p>
          </div>

          <div className="border-t border-gray-50 pt-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-muted-light">{timeAgo(ad.createdAt, T)}</span>
              <span className="price-tag flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {ad.price != null && ad.price > 0 ? `${ad.price.toLocaleString()} ${symbol}` : T("حسب الاتفاق")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                {ad.seller?.avatar ? (
                  <img src={ad.seller.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">{(ad.seller?.name || T("ب"))[0]}</span>
                )}
              </div>
              <span className="text-[11px] font-bold text-[var(--foreground)] truncate flex-1">
                {ad.seller?.name || T("بائع")}
              </span>
              {rating > 0 && <RatingStars rating={rating} size="sm" />}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            <button
              onClick={handleToggleFavorite}
              disabled={favBusy}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition disabled:opacity-50 ${
                favorited
                  ? "bg-rose-50 text-rose-500 border-rose-200"
                  : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-rose-200 hover:text-rose-500"
              }`}
              title={favorited ? T("إزالة من المفضلة") : T("حفظ في المفضلة")}
            >
              <Heart className={`w-3.5 h-3.5 ${favorited ? "fill-current" : ""}`} />
            </button>
            {!sent ? (
              <button
                onClick={handleContact}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {sending ? T("جاري الإرسال...") : T("تواصل مع البائع")}
              </button>
            ) : (
              <div className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center">
                {T("✅ تم إرسال طلبك")}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function CategorySection({ category, items }: { category: string; items: AdItem[] }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{CATEGORY_ICONS[category] || "📌"}</span>
          <h3 className="font-extrabold text-base">{T(CATEGORY_LABELS[category] || category)}</h3>
          <span className="text-xs text-muted-light bg-[var(--border-light)] px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        {items.length <= 3 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((ad) => <AdCard key={ad._id} ad={ad} />)}
          </div>
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
              {items.map((ad) => (
                <div key={ad._id} className="flex-shrink-0" style={{ width: 240 }}>
                  <AdCard ad={ad} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: T("الكل"), count: ads.length },
    { key: "general", label: T("إعلانات تجارية"), count: ads.filter((a) => a.type === "general").length },
    { key: "professional", label: T("خدمات مهنية"), count: ads.filter((a) => a.type === "professional").length },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Megaphone className="w-6 h-6 text-primary" />
        <h1>{T("الإعلانات")}</h1>
      </div>

      {/* Search + Filters toggle */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={T("ابحث في الإعلانات...")}
            className="w-full py-3 px-4 pr-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/5 transition"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" />
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold border transition whitespace-nowrap ${
            showFilters
              ? "bg-primary text-white border-primary"
              : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--border-light)]"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {T("فلاتر")}
        </button>
      </div>

      {/* لوحة الفلاتر */}
      {showFilters && (
        <div className="app-card p-4 mb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="filter-label">{T("الحالة")}</label>
              <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} className="filter-select">
                <option value="all">{T("الكل")}</option>
                <option value="active">{T("متوفر")}</option>
                <option value="coming_soon">{T("قريباً")}</option>
                <option value="reserved">{T("محجوز")}</option>
                <option value="sold">{T("تم البيع")}</option>
                <option value="expired">{T("منتهي")}</option>
              </select>
            </div>
            <div>
              <label className="filter-label">{T("القسم")}</label>
              <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)} className="filter-select">
                <option value="all">{T("كل الأقسام")}</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{T(label)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="filter-label">{T("الموقع")}</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilter("location", e.target.value)}
                placeholder={T("المدينة أو المنطقة")}
                className="filter-select"
              />
            </div>
            <div>
              <label className="filter-label">{T("التقييم")}</label>
              <select value={filters.minRating} onChange={(e) => setFilter("minRating", e.target.value)} className="filter-select">
                {RATING_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{T(r.label)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="filter-label">{T("أقل سعر")}</label>
              <input
                type="number"
                min="0"
                value={filters.minPrice}
                onChange={(e) => setFilter("minPrice", e.target.value)}
                placeholder="0"
                className="filter-select"
              />
            </div>
            <div>
              <label className="filter-label">{T("أعلى سعر")}</label>
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => setFilter("maxPrice", e.target.value)}
                placeholder={T("بدون حد")}
                className="filter-select"
              />
            </div>
            <div>
              <label className="filter-label">{T("الترتيب")}</label>
              <select value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)} className="filter-select">
                <option value="new">{T("الأحدث")}</option>
                <option value="price_asc">{T("الأقل سعراً")}</option>
                <option value="price_desc">{T("الأعلى سعراً")}</option>
                <option value="views">{T("الأكثر مشاهدة")}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter("newOnly", !filters.newOnly)}
              className={`filter-chip ${filters.newOnly ? "filter-chip-active" : ""}`}
            >
              <Clock className="w-3.5 h-3.5" /> {T("جديد")}
            </button>
            <button
              onClick={() => setFilter("boostedOnly", !filters.boostedOnly)}
              className={`filter-chip ${filters.boostedOnly ? "filter-chip-active" : ""}`}
            >
              {T("⚡ معزز")}
            </button>
            <button
              onClick={() => setFilter("verified", !filters.verified)}
              className={`filter-chip ${filters.verified ? "filter-chip-active" : ""}`}
            >
              <BadgeCheck className="w-3.5 h-3.5" /> {T("موثق")}
            </button>
            <button
              onClick={resetFilters}
              className="ms-auto text-xs font-bold text-red-500 hover:text-red-600 transition"
            >
              {T("مسح الفلاتر")}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-md"
                : "bg-[var(--card)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--border-light)]"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-[var(--border-light)] text-[var(--muted-light)]"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Megaphone />
          <h3>{T("لا توجد إعلانات")}</h3>
          <p>{T("لا توجد إعلانات في هذا القسم حالياً")}</p>
          <Link href="/add-post" className="btn btn-primary mt-3">{T("أضف إعلانك الآن")}</Link>
        </div>
      ) : (
        <>
          {activeTab === "all" && (
            <>
              {jobs.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                    <h2 className="font-extrabold text-lg">{T("اعلانات التوظيف")}</h2>
                    <span className="text-xs text-muted-light bg-[var(--border-light)] px-2 py-0.5 rounded-full">{jobs.length}</span>
                    <Link href="/jobs" className="ms-auto inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark transition">
                      {T("عرض جميع الوظائف")} <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {jobs.map((job) => <JobCard key={job._id} job={job} />)}
                  </div>
                </div>
              )}
              {generalCategories.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-amber-500 rounded-full" />
                    <h2 className="font-extrabold text-lg">{T("إعلانات تجارية")}</h2>
                  </div>
                  {generalCategories.map((cat) => (
                    <CategorySection key={cat} category={cat} items={grouped[cat]} />
                  ))}
                </div>
              )}
              {professionalCategories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-primary rounded-full" />
                    <h2 className="font-extrabold text-lg">{T("خدمات مهنية")}</h2>
                  </div>
                  {professionalCategories.map((cat) => (
                    <CategorySection key={cat} category={cat} items={grouped[cat]} />
                  ))}
                </div>
              )}
            </>
          )}
          {activeTab === "general" && (
            <>
              {generalCategories.map((cat) => (
                <CategorySection key={cat} category={cat} items={grouped[cat]} />
              ))}
            </>
          )}
          {activeTab === "professional" && (
            <>
              {professionalCategories.map((cat) => (
                <CategorySection key={cat} category={cat} items={grouped[cat]} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
