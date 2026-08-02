"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, MapPin, Search, Megaphone, MessageSquare } from "lucide-react";

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

export default function AdsPage() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/ads/public")
      .then((r) => r.json())
      .then((d) => { setAds(d.ads || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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

    async function handleContact() {
      setSending(true);
      try {
        const res = await fetch("/api/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId: ad._id, message: `أنا مهتم بـ "${ad.title}"` }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.conversationId) {
            window.location.href = `/messages/${data.conversationId}`;
            return;
          }
          setSent(true);
        } else {
          alert(data.error || "حدث خطأ");
        }
      } catch {
        alert("فشل الاتصال");
      }
      setSending(false);
    }

    return (
      <div className="app-card flex flex-col justify-between overflow-hidden">
        {ad.images && ad.images.length > 0 && ad.images[0] && (
          <div className="relative w-full h-36 bg-slate-100">
            <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-3 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex gap-1.5 mb-2">
              <span className={`badge ${ad.type === "professional" ? "badge-primary" : "badge-warning"}`}>
                {ad.type === "professional" ? "خدمة مهنية" : "إعلان تجاري"}
              </span>
            </div>
            <h4 className="text-sm font-bold mb-1 line-clamp-1">{ad.title}</h4>
            <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-2">{ad.description}</p>
          </div>
          <div className="border-t border-gray-50 pt-2 flex justify-between items-center">
            <span className="price-tag flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {ad.price ? `${ad.price.toLocaleString()} ${symbol}` : "حسب الاتفاق"}
            </span>
            <span className="text-[11px] text-muted-light flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> {ad.location}
            </span>
          </div>
          {!sent ? (
            <button
              onClick={handleContact}
              disabled={sending}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {sending ? "جاري الإرسال..." : "تواصل مع البائع"}
            </button>
          ) : (
            <div className="mt-2 w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center">
              ✅ تم إرسال طلبك
            </div>
          )}
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
          <h3 className="font-extrabold text-base">{CATEGORY_LABELS[category] || category}</h3>
          <span className="text-xs text-muted-light bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
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
    { key: "all", label: "الكل", count: ads.length },
    { key: "general", label: "إعلانات تجارية", count: ads.filter((a) => a.type === "general").length },
    { key: "professional", label: "خدمات مهنية", count: ads.filter((a) => a.type === "professional").length },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Megaphone className="w-6 h-6 text-primary" />
        <h1>الإعلانات</h1>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في الإعلانات..."
          className="w-full py-3 px-4 pr-10 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/5 transition"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
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
          <h3>لا توجد إعلانات</h3>
          <p>لا توجد إعلانات في هذا القسم حالياً</p>
          <Link href="/add-post" className="btn btn-primary mt-3">أضف إعلانك الآن</Link>
        </div>
      ) : (
        <>
          {activeTab === "all" && (
            <>
              {generalCategories.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-amber-500 rounded-full" />
                    <h2 className="font-extrabold text-lg">إعلانات تجارية</h2>
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
                    <h2 className="font-extrabold text-lg">خدمات مهنية</h2>
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
