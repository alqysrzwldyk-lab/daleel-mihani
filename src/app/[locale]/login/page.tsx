"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Loader2, LogIn } from "lucide-react"; // إضافة أيقونات حركية لإعطاء طابع احترافي

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false); // إيقاف التحميل فوراً عند حدوث خطأ من السيرفر
        const fieldKey = data.field as string | undefined;
        const errorKey = data.error as string;
        if (fieldKey && fieldKey !== "validation") {
          setError(t(`errors.${fieldKey}` as "errors.generic"));
        } else if (errorKey) {
          setError(t(`errors.${errorKey}` as "errors.generic"));
        } else {
          setError(t("errors.generic"));
        }
        return;
      }

      // 🚀 الحل السحري: التوجيه أولاً وبشكل فوري لإنهاء التعليق القاتل
      const targetPath = data.user.role === "professional" ? "/dashboard" : "/search";
      window.location.href = targetPath;

      // كسر الكاش وتحديث الجلسة بسلاسة تامة بعد بدء التوجيه
      setTimeout(() => {
        router.refresh();
      }, 100);

    } catch (err) {
      console.error("Login connection error:", err);
      setError(t("errors.generic"));
      setLoading(false); // ضمان عدم تعليق الزر في حال فشل شبكة الاتصال
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 text-right" style={{ direction: "rtl" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 transform transition duration-300">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-6">{t("loginTitle")}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-4 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition"
              required
            />
          </div>
          
          {/* ترقية الزر الميت بنقاط ثلاث إلى زر تفاعلي حركي عالمي */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 text-sm active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{loading ? "جاري تسجيل الدخول..." : t("loginBtn")}</span>
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-blue-600 font-bold hover:underline transition">
            {t("registerBtn")}
          </Link>
        </p>
      </div>
    </div>
  );
}