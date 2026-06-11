"use client";

import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";

function RegisterForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const initialRole = (() => {
    const r = searchParams.get("role");
    return r === "employer" || r === "professional"
      ? (r as "professional" | "employer")
      : "professional";
  })();

  const [role, setRole] = useState<"professional" | "employer">(initialRole);
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

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        password,
        role,
      }),
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

    if (role === "professional") {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/search";
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl card-shadow border border-[var(--border)] p-8">
      <h1 className="text-2xl font-bold text-center mb-6">{t("registerTitle")}</h1>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            minLength={6}
            required
          />
          <p className="text-xs text-[var(--muted)] mt-1">6 أحرف على الأقل</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t("role")}</label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:border-[var(--primary)] transition">
              <input
                type="radio"
                name="role"
                value="professional"
                checked={role === "professional"}
                onChange={() => setRole("professional")}
                className="mt-1"
              />
              <span className="text-sm">{t("roleProfessional")}</span>
            </label>
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:border-[var(--primary)] transition">
              <input
                type="radio"
                name="role"
                value="employer"
                checked={role === "employer"}
                onChange={() => setRole("employer")}
                className="mt-1"
              />
              <span className="text-sm">{t("roleEmployer")}</span>
            </label>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "..." : t("registerBtn")}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--muted)] mt-6">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-[var(--primary)] font-medium">
          {t("loginBtn")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-md h-96 bg-white rounded-2xl animate-pulse" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
