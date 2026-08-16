"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/useT";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";

const hasAnyProvider = !!(GOOGLE_CLIENT_ID || FACEBOOK_APP_ID);

export default function OAuthButtons() {
  const [loading, setLoading] = useState<"google" | "facebook" | null>(null);
  const [error, setError] = useState("");
  const googleBtnRef = useRef<HTMLButtonElement>(null);
  const scriptLoading = useRef(false);
  const T = useT();

  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setLoading("google");
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      setError(data.error || T("فشل تسجيل الدخول via Google"));
    } catch {
      setError(T("فشل الاتصال بخادم Google"));
    } finally {
      setLoading(null);
    }
  }, [T]);

  // Load GIS script once
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google || scriptLoading.current) return;
    scriptLoading.current = true;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!FACEBOOK_APP_ID) return;
    if (window.FB) return;

    window.fbAsyncInit = function () {
      if (window.FB) {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: false,
          version: "v22.0",
        });
      }
    };

    const script = document.createElement("script");
    script.src = `https://connect.facebook.net/ar_AR/sdk.js`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, []);

  function handleGoogleClick() {
    if (!window.google) {
      setError(T("لم يتم تحميل مكتبة Google بعد، حاول مرة أخرى"));
      return;
    }
    setError("");
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    window.google.accounts.id.prompt();
  }

  function handleFacebookLogin() {
    if (!window.FB) {
      setError(T("لم يتم تحميل Facebook SDK"));
      return;
    }
    setLoading("facebook");
    setError("");
    window.FB.login(
      async (response) => {
        if (!response.authResponse) {
          setError(T("تم إلغاء تسجيل الدخول via Facebook"));
          setLoading(null);
          return;
        }
        try {
          const res = await fetch("/api/auth/facebook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: response.authResponse.accessToken }),
          });
          if (res.ok) {
            window.location.href = "/";
            return;
          }
          const data = await res.json();
          setError(data.error || T("فشل تسجيل الدخول via Facebook"));
        } catch {
          setError(T("فشل الاتصال بخادم Facebook"));
        } finally {
          setLoading(null);
        }
      },
      { scope: "email,public_profile" }
    );
  }

  if (!hasAnyProvider) return null;

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-3 py-2">
        <span className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-muted font-medium">{T("أو")}</span>
        <span className="flex-1 h-px bg-gray-200" />
      </div>

      {error && (
        <div className="bg-danger-light text-danger text-sm p-3 rounded-xl">{error}</div>
      )}

      {GOOGLE_CLIENT_ID && (
        <button
          ref={googleBtnRef}
          onClick={handleGoogleClick}
          disabled={loading === "google"}
          className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] hover:bg-[var(--border-light)] hover:border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          {loading === "google" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading === "google" ? T("جاري...") : T("تابع عبر Google")}
        </button>
      )}

      {FACEBOOK_APP_ID && (
        <button
          onClick={handleFacebookLogin}
          disabled={loading === "facebook"}
          className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-[#1877F2] text-white hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {loading === "facebook" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
          {loading === "facebook" ? T("جاري...") : T("تابع عبر Facebook")}
        </button>
      )}
    </div>
  );
}