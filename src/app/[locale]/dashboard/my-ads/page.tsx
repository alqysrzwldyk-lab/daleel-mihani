"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2, Tag, MapPin, Calendar, ArrowLeft, Package, Rocket, X, Loader2,
  Pencil, BarChart3, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import AdEditModal, { type AdEditable } from "@/components/AdEditModal";
import AdStatusBadge, { type AdStatus } from "@/components/AdStatusBadge";
import { useT } from "@/lib/useT";

const STATUS_OPTIONS: { value: AdStatus; label: string }[] = [
  { value: "active", label: "متوفر" },
  { value: "coming_soon", label: "قريباً" },
  { value: "reserved", label: "محجوز" },
  { value: "sold", label: "تم البيع" },
  { value: "expired", label: "منتهي" },
  { value: "paused", label: "موقوف مؤقتاً" },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  YER: "﷼",
  SAR: "﷼",
  USD: "$",
};

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
  status: AdStatus;
  specifications: Record<string, string>;
  images?: string[];
  views?: number;
  contactCount?: number;
  sharesCount?: number;
  favoritesCount?: number;
};

const BOOST_OPTIONS = [
  { days: "3", price: 1000, label: "3 أيام" },
  { days: "7", price: 2000, label: "أسبوع" },
  { days: "30", price: 5000, label: "شهر" },
];

function BoostModal({ adId, onClose }: { adId: string; onClose: () => void }) {
  const T = useT();
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
        setMsg(`✅ ${T(data.message)}`);
        setTimeout(onClose, 1500);
      } else {
        setMsg(`❌ ${T(data.error)}`);
      }
    } catch {
      setMsg(`❌ ${T("فشل الاتصال")}`);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--surface)] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-xl animate-slide-up">
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full hover:bg-[var(--border-light)] flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-primary" />
          <h3 className="font-extrabold">{T("تعزيز الإعلان")}</h3>
        </div>
        <p className="text-sm text-muted mb-4">{T("اختر المدة لتعزيز ظهور إعلانك في أعلى النتائج")}</p>
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
              <span className="font-bold text-sm">{T(opt.label)}</span>
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
  const T = useT();
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [boostAdId, setBoostAdId] = useState<string | null>(null);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

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
    if (!confirm(T("هل أنت متأكد من حذف هذا الإعلان؟"))) return;
    try {
      const res = await fetch(`/api/ads/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setAds((prev) => prev.filter((ad) => ad._id !== id));
      } else {
        alert(data.error ? T(data.error) : T("حدث خطأ"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    }
  };

  const handleChangeStatus = async (ad: AdItem, newStatus: AdStatus) => {
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
        setAds((prev) => prev.map((a) => (a._id === ad._id ? { ...a, status: newStatus } : a)));
      } else {
        alert(data.error ? T(data.error) : T("حدث خطأ"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
    } finally {
      setActionId(null);
    }
  };

  const statusBadge = (status: AdStatus) => <AdStatusBadge status={status} />;

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
        <h1>{T("محفظتي الإعلانية")}</h1>
        <span className="badge badge-primary me-auto">{T("{count} إعلان", { count: ads.length })}</span>
      </div>

      {msg && <div className="bg-danger-light text-danger text-sm p-3 rounded-xl mb-4">{T(msg)}</div>}

      {ads.length === 0 ? (
        <div className="empty-state">
          <Package />
          <h3>{T("المحفظة فارغة")}</h3>
          <p>{T("لم تقم بنشر أي إعلان بعد. أضف إعلانك الأول الآن!")}</p>
          <button onClick={() => router.push("/add-post")} className="btn btn-primary mt-4">
            {T("إضافة إعلان")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ads.map((ad) => {
            const symbol = CURRENCY_SYMBOLS[ad.currency || ""] ?? "﷼";
            const isBusy = actionId === ad._id;
            return (
            <div key={ad._id} className="app-card p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {ad.images && ad.images[0] ? (
                  <Link href={`/ads/${ad._id}`} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                    <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                  </Link>
                ) : (
                  <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-[var(--border-light)]/40 border border-[var(--border)] flex items-center justify-center">
                    <Tag className="w-6 h-6 text-[var(--muted-light)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={`badge ${ad.type === "professional" ? "badge-primary" : "badge-warning"}`}>
                      {ad.type === "professional" ? T("💼 خدمة مهنية") : T("📦 إعلان عام")}
                    </span>
                    {statusBadge(ad.status)}
                  </div>
                  <Link href={`/ads/${ad._id}`}>
                    <h3 className="text-sm font-bold line-clamp-1 hover:text-primary transition">{ad.title}</h3>
                  </Link>
                  <p className="text-[11px] text-muted line-clamp-1 mt-0.5">{ad.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-1.5 text-[11px] text-muted-light border-t border-[var(--border-light)] pt-2.5">
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <Tag className="w-3 h-3 text-primary" />
                  {ad.price ? `${ad.price.toLocaleString()} ${symbol}` : T("سعر قابل للتفاوض")}
                </span>
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {ad.location}</span>
                <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(ad.createdAt).toLocaleDateString("ar-EG")}</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                <button
                  onClick={() => setEditingAd(ad)}
                  className="flex flex-col items-center gap-0.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition"
                  title={T("تعديل")}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{T("تعديل")}</span>
                </button>
                <div className="relative flex flex-col items-center gap-0.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition">
                  <ChevronDown className="w-3.5 h-3.5 pointer-events-none" />
                  <select
                    value={ad.status}
                    disabled={isBusy}
                    onChange={(e) => handleChangeStatus(ad, e.target.value as AdStatus)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:opacity-30"
                    title={T("تغيير حالة الإعلان")}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{T(opt.label)}</option>
                    ))}
                  </select>
                  <span className="text-[10px] font-bold">{T("الحالة")}</span>
                </div>
                <button
                  onClick={() => router.push(`/ads/${ad._id}/stats`)}
                  className="flex flex-col items-center gap-0.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg transition"
                  title={T("إحصائيات")}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{T("إحصائيات")}</span>
                </button>
                <button
                  onClick={() => setBoostAdId(ad._id)}
                  className="flex flex-col items-center gap-0.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                  title={T("تعزيز")}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{T("تعزيز")}</span>
                </button>
                <button
                  onClick={() => handleDelete(ad._id)}
                  className="flex flex-col items-center gap-0.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                  title={T("حذف")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{T("حذف")}</span>
                </button>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {boostAdId && <BoostModal adId={boostAdId} onClose={() => setBoostAdId(null)} />}
      {editingAd && (
        <AdEditModal
          ad={editingAd}
          onClose={() => setEditingAd(null)}
          onSaved={(updated) =>
            setAds((prev) => prev.map((a) => (a._id === updated._id ? updated as AdItem : a)))
          }
        />
      )}
    </div>
  );
}
