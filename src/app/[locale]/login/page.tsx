"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader2, LogIn, Briefcase, Mail, Lock } from "lucide-react";
import OAuthButtons from "@/components/OAuthButtons";
import { useT } from "@/lib/useT";

export default function LoginPage() {
  const t = useTranslations("auth");
  const T = useT();
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
        setLoading(false);
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

      const role = (data.user as { role?: string } | undefined)?.role;
      if (role === "employer") window.location.href = "/dashboard/jobs";
      else if (role === "admin") window.location.href = "/admin";
      else window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login connection error:", err);
      setError(t("errors.generic"));
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page-bg" />
      <div className="auth-page-grid" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
      <div className="auth-card">
        <div className="auth-logo">
          <Briefcase />
        </div>

        <h1 className="auth-title">{t("loginTitle")}</h1>
        <p className="auth-subtitle">{T("مرحباً بعودتك! سجل دخولك للمتابعة")}</p>

        {error && <div className="auth-error">{T(error)}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">{t("email")}</label>
            <div className="auth-input-wrap">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="your@email.com"
                required
              />
              <Mail className="auth-input-icon" />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">{t("password")}</label>
            <div className="auth-input-wrap">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                required
              />
              <Lock className="auth-input-icon" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LogIn />
            )}
            {loading ? T("جاري تسجيل الدخول...") : t("loginBtn")}
          </button>
        </form>

        <OAuthButtons />

        <p className="auth-footer">
          {t("noAccount")}{" "}
          <Link href="/register">{t("registerBtn")}</Link>
        </p>
      </div>
    </div>
  );
}
