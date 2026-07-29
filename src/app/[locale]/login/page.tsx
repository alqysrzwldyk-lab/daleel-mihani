"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader2, LogIn, Briefcase } from "lucide-react";
import OAuthButtons from "@/components/OAuthButtons";

export default function LoginPage() {
  const t = useTranslations("auth");
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

      window.location.href = "/";
    } catch (err) {
      console.error("Login connection error:", err);
      setError(t("errors.generic"));
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1>{t("loginTitle")}</h1>
          <p className="subtitle">مرحباً بعودتك! سجل دخولك للمتابعة</p>
        </div>

        {error && (
          <div className="bg-danger-light text-danger text-sm p-3 rounded-xl mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t("password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg mt-2">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {loading ? "جاري تسجيل الدخول..." : t("loginBtn")}
          </button>
        </form>

        <div className="mt-6">
          <OAuthButtons />
        </div>

        <p className="text-center text-sm text-muted mt-6">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            {t("registerBtn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
