"use client";

import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2, UserPlus, Briefcase, Building2 } from "lucide-react";
import OAuthButtons from "@/components/OAuthButtons";

function RegisterForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"professional" | "employer">("professional");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "employer" || r === "professional") setRole(r);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setLoading(false);
      setError("الاسم يجب أن يكون حرفين على الأقل");
      return;
    }
    if (password.length < 6) {
      setLoading(false);
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
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

    window.location.href = "/";
  }

  return (
    <div className="form-card">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        <h1>{t("registerTitle")}</h1>
        <p className="subtitle">انضم إلى الدليل المهني وابدأ رحلتك</p>
      </div>

      {error && (
        <div className="bg-danger-light text-danger text-sm p-3 rounded-xl mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="input-group">
          <label className="input-label">{t("name")}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="الاسم الكامل" required />
        </div>

        <div className="input-group">
          <label className="input-label">{t("email")}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" required />
        </div>

        <div className="input-group">
          <label className="input-label">{t("password")}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" minLength={6} required />
          <p className="text-xs text-muted mt-1">6 أحرف على الأقل</p>
        </div>

        <div className="input-group">
          <label className="input-label">{t("role")}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("professional")}
              className={`p-4 rounded-xl border-2 text-center transition ${
                role === "professional"
                  ? "border-primary bg-primary-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <Briefcase className={`w-6 h-6 mx-auto mb-1 ${role === "professional" ? "text-primary" : "text-muted-light"}`} />
              <span className={`text-xs font-semibold ${role === "professional" ? "text-primary" : "text-muted"}`}>
                محترف
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole("employer")}
              className={`p-4 rounded-xl border-2 text-center transition ${
                role === "employer"
                  ? "border-primary bg-primary-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <Building2 className={`w-6 h-6 mx-auto mb-1 ${role === "employer" ? "text-primary" : "text-muted-light"}`} />
              <span className={`text-xs font-semibold ${role === "employer" ? "text-primary" : "text-muted"}`}>
                صاحب شركة
              </span>
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg mt-2">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UserPlus className="w-5 h-5" />
          )}
          {loading ? "جاري إنشاء الحساب..." : t("registerBtn")}
        </button>
      </form>

      <div className="mt-6">
        <OAuthButtons />
      </div>

      <p className="text-center text-sm text-muted mt-6">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-primary font-bold hover:underline">
          {t("loginBtn")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="form-page">
      <Suspense fallback={<div className="skeleton h-96 w-full max-w-md rounded-xl" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
