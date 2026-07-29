"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Tag, MapPin, Send, Upload, X } from "lucide-react";

const CATEGORIES: Record<string, { key: string; label: string }[]> = {
  general: [
    { key: "cars", label: "🚗 سيارات ومركبات" },
    { key: "lands", label: "🗺️ أراضي وعقارات" },
    { key: "electronics", label: "📱 أجهزة وإلكترونيات" },
    { key: "furniture", label: "🛋️ أثاث" },
    { key: "home-tools", label: "🏠 أدوات منزلية" },
    { key: "weapons", label: "🔫 سلاح وذخائر" },
    { key: "other", label: "📦 أخرى" },
  ],
  professional: [
    { key: "services", label: "🛠️ خدمات صيانة" },
    { key: "programming", label: "💻 برمجة وتقنية" },
    { key: "accounting", label: "📊 محاسبة واستشارات" },
    { key: "design", label: "🎨 تصميم" },
    { key: "teaching", label: "📚 تدريس" },
    { key: "other", label: "✨ أخرى" },
  ],
};

const CURRENCIES = [
  { key: "YER", label: "﷼ يمني", symbol: "﷼" },
  { key: "SAR", label: "﷼ سعودي", symbol: "﷼" },
  { key: "USD", label: "$ دولار", symbol: "$" },
];

export default function AddPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [type, setType] = useState("general");
  const [category, setCategory] = useState("cars");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("YER");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [carModel, setCarModel] = useState("");
  const [landArea, setLandArea] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setImages((prev) => [...prev, data.url]);
      } else {
        setStatusMsg("فشل رفع الصورة");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setStatusMsg("فشل رفع الصورة");
    } finally {
      setUploadingImg(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");

    const specifications: Record<string, string> = {};
    if (category === "cars") specifications.model = carModel;
    if (category === "lands") specifications.area = landArea;

    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, category, title, description,
          price: price || null,
          currency,
          location,
          specifications,
          images,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMsg("تم نشر الإعلان بنجاح!");
        setTimeout(() => router.push("/dashboard/my-ads"), 2000);
      } else {
        setStatusMsg(data.error || "حدث خطأ ما");
      }
    } catch (error) {
      console.error(error);
      setStatusMsg("فشل الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container max-w-xl mx-auto">
      <div className="page-header">
        <button onClick={() => router.back()} className="back-btn">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1>إضافة إعلان جديد</h1>
      </div>

      <form onSubmit={handleSubmit} className="app-card p-5 space-y-5">
        <div className="input-group">
          <label className="input-label">نوع الإعلان</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setType("general"); setCategory("cars"); }}
              className={`p-3 rounded-xl border-2 text-center text-sm font-semibold transition ${
                type === "general" ? "border-primary bg-primary-50 text-primary" : "border-gray-100 text-muted"
              }`}
            >
              📦 إعلان تجاري
            </button>
            <button
              type="button"
              onClick={() => { setType("professional"); setCategory("services"); }}
              className={`p-3 rounded-xl border-2 text-center text-sm font-semibold transition ${
                type === "professional" ? "border-primary bg-primary-50 text-primary" : "border-gray-100 text-muted"
              }`}
            >
              💼 خدمة مهنية
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">القسم</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
            {(CATEGORIES[type] || CATEGORIES.general).map((cat) => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">صور الإعلان</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100">
                <Image src={url} alt="" width={80} height={80} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-primary transition">
                {uploadingImg ? <Loader2 className="w-5 h-5 animate-spin text-muted" /> : <Upload className="w-5 h-5 text-muted" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
              </label>
            )}
          </div>
          <p className="text-[11px] text-muted">يمكنك إضافة حتى 5 صور</p>
        </div>

        <div className="input-group">
          <label className="input-label">عنوان الإعلان</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="مثال: تويوتا كامري 2022 بحالة الوكالة" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="input-group">
            <label className="input-label">السعر</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="0" />
          </div>
          <div className="input-group">
            <label className="input-label">العملة</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field">
              {CURRENCIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label flex items-center gap-1">
            <MapPin className="w-4 h-4 text-muted" /> الموقع
          </label>
          <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" placeholder="اكتب المدينة أو المنطقة" />
        </div>

        {category === "cars" && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-primary mb-2">مواصفات السيارة</p>
            <input type="text" placeholder="سنة الصنع والموديل" value={carModel} onChange={(e) => setCarModel(e.target.value)} className="input-field" />
          </div>
        )}

        {category === "lands" && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-primary mb-2">مواصفات الأرض</p>
            <input type="text" placeholder="المساحة بالمتر المربع" value={landArea} onChange={(e) => setLandArea(e.target.value)} className="input-field" />
          </div>
        )}

        <div className="input-group">
          <label className="input-label">الوصف والتفاصيل</label>
          <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="اكتب تفاصيل الإعلان كاملة..." />
        </div>

        {statusMsg && (
          <div className={`text-sm font-medium p-3 rounded-xl text-center ${
            statusMsg.includes("نجاح") ? "bg-success-light text-success" : "bg-danger-light text-danger"
          }`}>
            {statusMsg}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {loading ? "جاري النشر..." : "انشر الإعلان"}
        </button>
      </form>
    </div>
  );
}
