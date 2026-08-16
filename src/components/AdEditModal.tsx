"use client";

import { useState } from "react";
import { X, Loader2, Pencil } from "lucide-react";
import { useT } from "@/lib/useT";

const GENERAL_CATEGORIES = [
  { key: "cars", label: "سيارات ومركبات" },
  { key: "lands", label: "أراضي وعقارات" },
  { key: "electronics", label: "أجهزة وإلكترونيات" },
  { key: "furniture", label: "أثاث" },
  { key: "home-tools", label: "أدوات منزلية" },
  { key: "weapons", label: "سلاح وذخائر" },
  { key: "other", label: "أخرى" },
];

const PROFESSIONAL_CATEGORIES = [
  { key: "services", label: "خدمات صيانة" },
  { key: "programming", label: "برمجة وتقنية" },
  { key: "accounting", label: "محاسبة واستشارات" },
  { key: "design", label: "تصميم" },
  { key: "teaching", label: "تدريس" },
  { key: "other", label: "أخرى" },
];

const CURRENCIES = [
  { key: "YER", label: "﷼ يمني" },
  { key: "SAR", label: "﷼ سعودي" },
  { key: "USD", label: "$ دولار" },
];

export type AdEditable = {
  _id: string;
  type: "professional" | "general";
  category: string;
  title: string;
  description: string;
  price?: number | null;
  currency?: string;
  location: string;
  specifications?: Record<string, string>;
  images?: string[];
};

export default function AdEditModal({
  ad,
  onClose,
  onSaved,
}: {
  ad: AdEditable;
  onClose: () => void;
  onSaved: (updated: AdEditable) => void;
}) {
  const categories = ad.type === "professional" ? PROFESSIONAL_CATEGORIES : GENERAL_CATEGORIES;
  const T = useT();

  const [category, setCategory] = useState(ad.category);
  const [title, setTitle] = useState(ad.title);
  const [description, setDescription] = useState(ad.description);
  const [price, setPrice] = useState(ad.price != null ? String(ad.price) : "");
  const [currency, setCurrency] = useState(ad.currency || "YER");
  const [location, setLocation] = useState(ad.location);
  const [specModel, setSpecModel] = useState(ad.specifications?.model || "");
  const [specArea, setSpecArea] = useState(ad.specifications?.area || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave() {
    if (!title.trim() || !description.trim() || !location.trim()) {
      setMsg("❌ " + T("العنوان والوصف والموقع مطلوبة"));
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const specifications: Record<string, string> = {};
      if (category === "cars" && specModel.trim()) specifications.model = specModel.trim();
      if (category === "lands" && specArea.trim()) specifications.area = specArea.trim();

      const res = await fetch(`/api/ads/${ad._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          description,
          price: price !== "" ? Number(price) : null,
          currency,
          location,
          specifications,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved({ ...ad, ...data.ad });
        onClose();
      } else {
        setMsg(`❌ ${T(data.error || "حدث خطأ")}`);
      }
    } catch {
      setMsg("❌ " + T("فشل الاتصال بالسيرفر"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--surface)] rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full hover:bg-[var(--border-light)] flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <Pencil className="w-5 h-5 text-primary" />
          <h3 className="font-extrabold">{T("تعديل الإعلان")}</h3>
        </div>

        {ad.images && ad.images.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted mb-2">{T("الصور الحالية (تبقى كما هي)")}</p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {ad.images.map((img, i) => (
                <img key={i} src={img} alt={T("إعلان")} className="w-16 h-14 rounded-lg object-cover flex-shrink-0" />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="input-group">
            <label className="input-label">{T("القسم")}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              {categories.map((c) => (
                <option key={c.key} value={c.key}>{T(c.label)}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">{T("عنوان الإعلان")}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" maxLength={120} />
          </div>

          <div className="input-group">
            <label className="input-label">{T("الوصف والتفاصيل")}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input-field resize-none" maxLength={2000} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="input-group">
              <label className="input-label">{T("السعر (اختياري)")}</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder={T("اتركه فارغاً = حسب الاتفاق")} />
            </div>
            <div className="input-group">
              <label className="input-label">{T("العملة")}</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field">
                {CURRENCIES.map((c) => (
                  <option key={c.key} value={c.key}>{T(c.label)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{T("الموقع (المدينة / المنطقة)")}</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" />
          </div>

          {category === "cars" && (
            <div className="input-group">
              <label className="input-label">{T("موديل السيارة")}</label>
              <input value={specModel} onChange={(e) => setSpecModel(e.target.value)} className="input-field" />
            </div>
          )}
          {category === "lands" && (
            <div className="input-group">
              <label className="input-label">{T("مساحة الأرض")}</label>
              <input value={specArea} onChange={(e) => setSpecArea(e.target.value)} className="input-field" />
            </div>
          )}

          {msg && (
            <div className={`p-3 rounded-xl text-sm font-bold ${msg.includes("❌") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
              {msg}
            </div>
          )}

          <button onClick={handleSave} disabled={loading} className="btn btn-primary btn-block">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : T("حفظ التعديلات")}
          </button>
        </div>
      </div>
    </div>
  );
}
