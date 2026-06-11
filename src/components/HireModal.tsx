"use client";

import React, { useState, FormEvent } from "react";

interface HireModalProps {
  professionalId: string;
  professionalName: string;
}

export default function HireModal({ professionalId, professionalName }: HireModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  async function handleSendRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");

    try {
      const res = await fetch("/api/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId,
          companyName,
          title,
          message,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMsg("✅ تم إرسال الطلب وإشعار المهني بنجاح!");
        setTimeout(() => {
          setIsOpen(false);
          setCompanyName("");
          setTitle("");
          setMessage("");
          setStatusMsg("");
        }, 2000);
      } else {
        setStatusMsg(`❌ ${data.error || "حدث خطأ ما"}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ فشل الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* زر فتح النافذة الذي سيظهر في بروفايل المهني */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-[var(--primary)] text-white font-medium py-3 px-6 rounded-xl hover:opacity-90 transition shadow-md"
      >
        💼 طلب توظيف / تقديم عرض عمل
      </button>

      {/* النافذة المنبثقة (Modal) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ direction: "rtl" }}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">إرسال عرض عمل إلى {professionalName}</h3>
            <p className="text-xs text-gray-500 mb-4">سيصل إشعار فوري للمهني بمجرد إرسال هذا النموذج.</p>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة أو المشروع</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: شركة الحلول المتقدمة"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الوظيفي المقترح</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مطور تطبيقات فلاتر محترف"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تفاصيل العرض والرسالة</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب تفاصيل المشروع، المميزات، أو طريقة التواصل المفضلة..."
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                ></textarea>
              </div>

              {statusMsg && (
                <div className="text-sm font-medium p-2 rounded-lg text-center bg-gray-50">
                  {statusMsg}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "جاري الإرسال..." : "إرسال العرض والطلب"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}