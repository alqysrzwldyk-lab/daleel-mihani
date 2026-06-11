"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Tag, MapPin, Calendar, Layers } from "lucide-react";

// 🌟 تعريف تيب دقيق يتطابق مع هيكل بيانات الإعلان في قاعدة البيانات
type AdItem = {
  _id: string;
  type: "professional" | "general";
  category: string;
  title: string;
  description: string;
  price: number | null;
  location: string;
  createdAt: string;
  specifications: Record<string, string>;
};

export default function MyWalletAdsPage() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/ads")
      .then((res) => res.json())
      .then((data) => {
        // نتحقق من وجود مصفوفة الإعلانات قبل تعيينها
        if (data.ads && Array.isArray(data.ads)) {
          setAds(data.ads);
        }
      })
      .catch(() => setMsg("❌ فشل تحميل محتويات المحفظة"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً من محفظتك؟")) return;

    try {
      const res = await fetch(`/api/ads/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        setAds((prev) => prev.filter((ad) => ad._id !== id));
        alert("✅ " + (data.message || "تم الحذف بنجاح"));
      } else {
        alert("❌ " + (data.error || "حدث خطأ"));
      }
    } catch {
      alert("❌ فشل الاتصال بالسيرفر");
    }
  };

  if (loading) return <div className="text-center py-20 text-xs font-bold">جاري فتح محفظتك الإعلانية...</div>;

  return (
    <div className="max-w-5xl mx-auto my-10 px-4" style={{ direction: "rtl" }}>
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-800">💼 محفظتي الإعلانية</h1>
          <p className="text-xs text-gray-500 mt-1">هنا تجد جميع إعلاناتك التجارية والمهنية التي قمت بنشرها.</p>
        </div>
        <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold">
          عدد الإعلانات: {ads.length}
        </span>
      </div>

      {msg && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs text-center mb-4">{msg}</div>}

      {ads.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500 font-medium">محفظتك فارغة حالياً! لم تقم بنشر أي إعلان بعد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ads.map((ad: AdItem) => ( // 🌟 استخدام AdItem بدلاً من any
            <div key={ad._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition relative flex flex-col justify-between">
              <div>
                <div className="flex gap-2 mb-2.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ad.type === "professional" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                    {ad.type === "professional" ? "💼 خدمة مهنية" : "📦 إعلان عام"}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {ad.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-gray-800 mb-1.5 line-clamp-1">{ad.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{ad.description}</p>

                {ad.specifications && Object.keys(ad.specifications).length > 0 && (
                  <div className="bg-gray-50 p-2 rounded-xl mb-3 flex flex-wrap gap-3 border border-gray-100">
                    {Object.entries(ad.specifications).map(([key, val]) => (
                      <span key={key} className="text-[11px] text-gray-600 font-medium">
                        🔹 {key === "model" ? "الموديل" : "المساحة"}: <strong className="text-gray-800">{val}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-50 pt-3 mt-2 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black text-orange-500 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    {ad.price ? `${ad.price.toLocaleString()} دينار` : "سعر قابل للتفاوض"}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {ad.location}</span>
                    <span className="hidden sm:flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(ad.createdAt).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(ad._id)}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                  title="حذف الإعلان"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}