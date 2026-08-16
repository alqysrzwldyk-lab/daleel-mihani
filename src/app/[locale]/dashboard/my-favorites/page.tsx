"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, MapPin, Tag, Clock, BadgeCheck, Camera } from "lucide-react";
import AdStatusBadge, { type AdStatus } from "@/components/AdStatusBadge";
import { useT } from "@/lib/useT";

const CURRENCY_SYMBOLS: Record<string, string> = {
  YER: "﷼",
  SAR: "﷼",
  USD: "$",
};

type FavoriteAd = {
  _id: string;
  type: "professional" | "general";
  category: string;
  title: string;
  description: string;
  price: number | null;
  currency?: string;
  location: string;
  status: AdStatus;
  images?: string[];
  createdAt?: string;
  verified?: boolean;
  boosted?: boolean;
  seller?: { name?: string; avatar?: string | null; averageRating?: number; ratingCount?: number };
};

export default function MyFavoritesPage() {
  const router = useRouter();
  const T = useT();
  const [ads, setAds] = useState<FavoriteAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/ads/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setMsg(data.error);
        else if (data.ads && Array.isArray(data.ads)) setAds(data.ads);
      })
      .catch(() => setMsg("فشل تحميل المفضلة"))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/ads/${id}/favorite`, { method: "DELETE" });
      if (res.ok) {
        setAds((prev) => prev.filter((a) => a._id !== id));
      } else {
        const data = await res.json();
        alert(data.error ? T(data.error) : T("حدث خطأ"));
      }
    } catch {
      alert(T("فشل الاتصال بالسيرفر"));
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
        <h1>{T("إعلاناتي المفضلة")}</h1>
        <span className="badge badge-primary me-auto">{T("{count} إعلان", { count: ads.length })}</span>
      </div>

      {msg && <div className="bg-danger-light text-danger text-sm p-3 rounded-xl mb-4">{T(msg)}</div>}

      {ads.length === 0 ? (
        <div className="empty-state">
          <Heart />
          <h3>{T("لا توجد مفضلة بعد")}</h3>
          <p>{T("اضغط على أيقونة القلب في أي إعلان لحفظه هنا والعودة إليه لاحقاً.")}</p>
          <button onClick={() => router.push("/ads")} className="btn btn-primary mt-4">
            {T("تصفح الإعلانات")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ads.map((ad) => {
            const symbol = CURRENCY_SYMBOLS[ad.currency || ""] ?? "﷼";
            return (
              <div key={ad._id} className="app-card overflow-hidden flex flex-col">
                <div className="relative h-32 bg-slate-100">
                  {ad.images && ad.images[0] ? (
                    <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-7 h-7 text-[var(--muted-light)]" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    {ad.boosted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold shadow">
                        ⚡ {T("معزز")}
                      </span>
                    )}
                    {ad.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-extrabold shadow">
                        <BadgeCheck className="w-3 h-3" /> {T("موثق")}
                      </span>
                    )}
                    <AdStatusBadge status={ad.status} />
                  </div>
                  <button
                    onClick={() => handleRemove(ad._id)}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-red-500 transition"
                    title={T("إزالة من المفضلة")}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`badge ${ad.type === "professional" ? "badge-primary" : "badge-warning"}`}>
                      {ad.type === "professional" ? T("💼 خدمة مهنية") : T("📦 إعلان عام")}
                    </span>
                    <span className="text-[11px] text-muted-light line-clamp-1 flex-1 text-left">{ad.category}</span>
                  </div>
                  <Link href={`/ads/${ad._id}`} className="block">
                    <h3 className="text-sm font-bold line-clamp-1 hover:text-primary transition">{ad.title}</h3>
                  </Link>
                  <p className="text-[11px] text-muted line-clamp-1">{ad.description}</p>

                  <div className="flex items-center justify-between flex-wrap gap-1 text-[11px] text-muted-light border-t border-[var(--border-light)] pt-2 mt-auto">
                    <span className="flex items-center gap-1 font-extrabold text-foreground">
                      <Tag className="w-3 h-3 text-primary" />
                      {ad.price ? `${ad.price.toLocaleString()} ${symbol}` : T("سعر قابل للتفاوض")}
                    </span>
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {ad.location}</span>
                    {ad.createdAt && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {new Date(ad.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {ad.seller?.avatar ? (
                      <img src={ad.seller.avatar} alt="" className="w-6 h-6 rounded-full object-cover bg-slate-100" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                        {(ad.seller?.name || T("ب"))[0]}
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-muted flex-1 line-clamp-1">{ad.seller?.name || T("بائع")}</span>
                    <button
                      onClick={() => router.push(`/ads/${ad._id}`)}
                      className="text-[11px] font-extrabold text-primary hover:underline"
                    >
                      {T("عرض التفاصيل")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
