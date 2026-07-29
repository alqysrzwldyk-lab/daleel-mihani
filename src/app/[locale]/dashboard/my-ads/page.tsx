"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Tag, MapPin, Calendar, ArrowLeft, Package, Rocket, X, Loader2 } from "lucide-react";

type AdItem = {
  _id: string;
  type: "professional" | "general";
  category: string;
  title: string;
  description: string;
  price: number | null;
  currency?: string;
  location: string;
  createdAt: string;
  specifications: Record<string, string>;
  images?: string[];
};

const BOOST_OPTIONS = [
  { days: "3", price: 1000, label: "3 أيام" },
  { days: "7", price: 2000, label: "أسبوع" },
  { days: "30", price: 5000, label: "شهر" },
];

function BoostModal({ adId, onClose }: { adId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleBoost(days: string, price: number) {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/ads/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, days: Number(days) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`✅ ${data.message}`);
        setTimeout(onClose, 1500);
      } else {
        setMsg(`❌ ${data.error}`);
      }
    } catch {
      setMsg("❌ فشل الاتصال");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm mx-4 p-6 shadow-xl animate-slide-up">
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-primary" />
          <h3 className="font-extrabold">تعزيز الإعلان</h3>
        </div>
        <p className="text-sm text-muted mb-4">اختر المدة لتعزيز ظهور إعلانك في أعلى النتائج</p>
        {msg && (
          <div className={`p-3 rounded-xl text-sm font-bold mb-4 ${msg.includes("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {msg}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {BOOST_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => handleBoost(opt.days, opt.price)}
              disabled={loading}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition disabled:opacity-50"
            >
              <span className="font-bold text-sm">{opt.label}</span>
              <span className="text-sm font-extrabold text-primary">{opt.price.toLocaleString()} ﷼</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MyWalletAdsPage() {
  const router = useRouter();
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [boostAdId, setBoostAdId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ads")
      .then((res) => res.json())
      .then((data) => {
        if (data.ads && Array.isArray(data.ads)) setAds(data.ads);
      })
      .catch(() => setMsg("فشل تحميل المحفظة"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    try {
      const res = await fetch(`/api/ads/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setAds((prev) => prev.filter((ad) => ad._id !== id));
      } else {
        alert(data.error || "حدث خطأ");
      }
    } catch {
      alert("فشل الاتصال بالسيرفر");
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <button onClick={() => router.back()} className="back-btn">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1>محفظتي الإعلانية</h1>
        <span className="badge badge-primary me-auto">{ads.length} إعلان</span>
      </div>

      {msg && <div className="bg-danger-light text-danger text-sm p-3 rounded-xl mb-4">{msg}</div>}

      {ads.length === 0 ? (
        <div className="empty-state">
          <Package />
          <h3>المحفظة فارغة</h3>
          <p>لم تقم بنشر أي إعلان بعد. أضف إعلانك الأول الآن!</p>
          <button onClick={() => router.push("/add-post")} className="btn btn-primary mt-4">
            إضافة إعلان
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ads.map((ad) => {
            const symbol = ad.currency === "USD" ? "$" : "﷼";
            return (
            <div key={ad._id} className="app-card overflow-hidden">
              {ad.images && ad.images.length > 0 && ad.images[0] && (
                <div className="relative w-full h-44 bg-slate-100">
                  <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex gap-2 mb-2.5">
                  <span className={`badge ${ad.type === "professional" ? "badge-primary" : "badge-warning"}`}>
                    {ad.type === "professional" ? "💼 خدمة مهنية" : "📦 إعلان عام"}
                  </span>
                  <span className="badge bg-gray-50 text-gray-500 border border-gray-100">{ad.category}</span>
                </div>
                <h3 className="text-sm font-bold mb-1 line-clamp-1">{ad.title}</h3>
                <p className="text-xs text-muted line-clamp-2 mb-3">{ad.description}</p>
                {ad.specifications && Object.keys(ad.specifications).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(ad.specifications).map(([key, val]) => (
                      <span key={key} className="text-[11px] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                        {key === "model" ? "موديل" : "مساحة"}: {val}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-50 pt-3 px-4 pb-4 flex justify-between items-center">
                <div>
                  <span className="price-tag flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    {ad.price ? `${ad.price.toLocaleString()} ${symbol}` : "سعر قابل للتفاوض"}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-muted-light mt-1">
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {ad.location}</span>
                    <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(ad.createdAt).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBoostAdId(ad._id)}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition"
                    title="تعزيز"
                  >
                    <Rocket className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ad._id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {boostAdId && <BoostModal adId={boostAdId} onClose={() => setBoostAdId(null)} />}
    </div>
  );
}
