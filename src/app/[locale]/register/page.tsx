"use client";

import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2, UserPlus, Briefcase, Building2, Mail, Lock, User } from "lucide-react";
import OAuthButtons from "@/components/OAuthButtons";

function RegisterForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"professional" | "employer">(() => {
    const r = searchParams.get("role");
    return r === "employer" || r === "professional" ? r : "professional";
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    try {
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

      window.location.href = role === "employer" ? "/dashboard/jobs" : "/dashboard";
    } catch (err) {
      console.error("Register connection error:", err);
      setLoading(false);
      setError("تعذر الاتصال بالخادم، تحقق من اتصال الإنترنت وحاول مجدداً");
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <UserPlus />
      </div>

      <h1 className="auth-title">{t("registerTitle")}</h1>
      <p className="auth-subtitle">انضم إلى الدليل المهني وابدأ رحلتك</p>

      {error && <div className="auth-error">{error}</div>}

      <div className="auth-role-grid">
        <button
          type="button"
          onClick={() => setRole("professional")}
          className={`auth-role-btn ${role === "professional" ? "active" : ""}`}
        >
          <Briefcase className={role === "professional" ? "text-blue-400" : "text-[#9ca3af]"} />
          <span className={role === "professional" ? "text-blue-400" : "text-[#6b7280]"}>محترف</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("employer")}
          className={`auth-role-btn ${role === "employer" ? "active" : ""}`}
        >
          <Building2 className={role === "employer" ? "text-blue-400" : "text-[#9ca3af]"} />
          <span className={role === "employer" ? "text-blue-400" : "text-[#6b7280]"}>صاحب شركة</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label">{t("name")}</label>
          <div className="auth-input-wrap">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="auth-input" placeholder="الاسم الكامل" required />
            <User className="auth-input-icon" />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">{t("email")}</label>
          <div className="auth-input-wrap">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" placeholder="your@email.com" required />
            <Mail className="auth-input-icon" />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">{t("password")}</label>
          <div className="auth-input-wrap">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" placeholder="••••••••" minLength={6} required />
            <Lock className="auth-input-icon" />
          </div>
          <p className="auth-field-hint">6 أحرف على الأقل</p>
        </div>

        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? <Loader2 className="animate-spin" /> : <UserPlus />}
          {loading ? "جاري إنشاء الحساب..." : t("registerBtn")}
        </button>
      </form>

      <OAuthButtons />

      <p className="auth-footer">
        {t("hasAccount")}{" "}
        <Link href="/login">{t("loginBtn")}</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-page-bg" />
      <div className="auth-page-grid" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
      <Suspense fallback={<div className="skeleton h-96 w-full max-w-md rounded-2xl" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
