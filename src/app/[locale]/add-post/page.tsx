"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // بيانات النموذج الأساسية
  const [type, setType] = useState("general"); // general أو professional
  const [category, setCategory] = useState("cars");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("عمان");
  
  // المواصفات الديناميكية حسب القسم
  const [carModel, setCarModel] = useState("");
  const [landArea, setLandArea] = useState("");

  async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setStatusMsg("");

        // تجميع المواصفات بناءً على القسم المختار
        const specifications: Record<string, string> = {};
        if (category === "cars") specifications.model = carModel;
        if (category === "lands") specifications.area = landArea;

        try {
            const res = await fetch("/api/ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    category,
                    title,
                    description,
                    price: price || null,
                    location,
                    specifications,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatusMsg("✅ تم نشر الإعلان بنجاح وحفظه في محفظتك!");
                setTimeout(() => {
                    router.push("/dashboard"); // التوجيه للمحفظة لمشاهدة إعلاناته
                }, 2000);
            } else {
                setStatusMsg(`❌ ${data.error || "حدث خطأ ما"}`);
            }
        } catch (error) {
            console.error(error);
            setStatusMsg("❌ فشل الاتصال بالسيرفر");
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className="max-w-2xl mx-auto my-10 p-6 bg-white rounded-2xl border border-gray-100 shadow-md" style={{ direction: "rtl" }}>
      <h2 className="text-xl font-black text-gray-800 mb-2">📢 إضافة إعلان جديد</h2>
      <p className="text-xs text-gray-500 mb-6">انشر خدماتك المهنية أو قم ببيع ممتلكاتك بسهولة في الأقسام المخصصة.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* نوع الإعلان */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">نوع الإعلان الرئيسي</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setType("general"); setCategory("cars"); }}
              className={`py-2.5 rounded-xl font-medium text-xs border transition ${type === "general" ? "bg-blue-50 border-blue-500 text-blue-600 font-bold" : "bg-gray-50 text-gray-600"}`}
            >
              📦 إعلان تجاري عام (بيع سيارة، أرض...)
            </button>
            <button
              type="button"
              onClick={() => { setType("professional"); setCategory("services"); }}
              className={`py-2.5 rounded-xl font-medium text-xs border transition ${type === "professional" ? "bg-blue-50 border-blue-500 text-blue-600 font-bold" : "bg-gray-50 text-gray-600"}`}
            >
              💼 إعلان خدمة مهنية (عرض مهنتك للتوظيف)
            </button>
          </div>
        </div>

        {/* القسم الفرعي */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">القسم</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 outline-none"
          >
            {type === "general" ? (
              <>
                <option value="cars">🚗 سيارات ومركبات</option>
                <option value="lands">🗺️ أراضي وعقارات</option>
                <option value="electronics">📱 أجهزة وإلكترونيات</option>
              </>
            ) : (
              <>
                <option value="services">🛠️ خدمات صيانة عامة</option>
                <option value="programming">💻 برمجة وتقنية</option>
                <option value="accounting">📊 خدمات محاسبة واستشارات</option>
              </>
            )}
          </select>
        </div>

        {/* عنوان الإعلان */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">عنوان الإعلان</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تويوتا كامري 2022 بحالة الوكالة / مهندس ديكور محترف"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none"
          />
        </div>

        {/* السعر - يظهر فقط للإعلانات العامة أو الخدمات المسعرة */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">السعر (اختياري - بالعملة المحلية)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="اتركه فارغاً في حال السعر يعتمد على الاتفاق"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none"
          />
        </div>

        {/* المدينة / الموقع الجغرافي */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">المدينة / المنطقة</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 outline-none"
          >
            <option value="عمان">عمان</option>
            <option value="إربد">إربد</option>
            <option value="الزرقاء">الزرقاء</option>
          </select>
        </div>

        {/* الحقول الديناميكية الخاصة بكل قسم */}
        {category === "cars" && (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <p className="text-[11px] font-bold text-blue-600">📋 مواصفات السيارة المطلوبة:</p>
            <input
              type="text"
              placeholder="سنة الصنع وموديل السيارة (مثال: 2022)"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs outline-none"
            />
          </div>
        )}

        {category === "lands" && (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <p className="text-[11px] font-bold text-blue-600">📋 مواصفات الأرض المطلوبة:</p>
            <input
              type="text"
              placeholder="مساحة الأرض بالمتر المربع (مثال: 500 م²)"
              value={landArea}
              onChange={(e) => setLandArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs outline-none"
            />
          </div>
        )}

        {/* تفاصيل الإعلان */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">شرح وتفاصيل الإعلان الكاملة</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب مواصفات السلعة بالكامل، أو تفاصيل الخدمة والخبرات التي تقدمها وطريقة التواصل المفضلة..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none"
          ></textarea>
        </div>

        {statusMsg && (
          <div className="text-xs font-medium p-2.5 rounded-xl text-center bg-gray-50">
            {statusMsg}
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-xl font-bold text-xs hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? "جاري نشر إعلانك..." : "🚀 انشر الإعلان الآن"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-xs text-gray-700 transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}