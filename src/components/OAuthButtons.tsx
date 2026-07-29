"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";

const hasAnyProvider = !!(GOOGLE_CLIENT_ID || FACEBOOK_APP_ID);

export default function OAuthButtons() {
  const [loading, setLoading] = useState<"google" | "facebook" | null>(null);
  const [error, setError] = useState("");
  const googleContainerRef = useRef<HTMLDivElement>(null);
  const gisLoaded = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    const interval = setInterval(() => {
      if (window.google && googleContainerRef.current && !gisLoaded.current) {
        gisLoaded.current = true;
        clearInterval(interval);
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        });
        window.google.accounts.id.renderButton(googleContainerRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: googleContainerRef.current.clientWidth || 400,
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  async function handleGoogleCredential(response: { credential: string }) {
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
      setError(data.error || "فشل تسجيل الدخول via Google");
    } catch {
      setError("فشل الاتصال بخادم Google");
    } finally {
      setLoading(null);
    }
  }

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

  function handleFacebookLogin() {
    if (!window.FB) {
      setError("لم يتم تحميل Facebook SDK");
      return;
    }
    setLoading("facebook");
    setError("");
    window.FB.login(
      async (response) => {
        if (!response.authResponse) {
          setError("تم إلغاء تسجيل الدخول via Facebook");
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
          setError(data.error || "فشل تسجيل الدخول via Facebook");
        } catch {
          setError("فشل الاتصال بخادم Facebook");
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
        <span className="text-xs text-muted font-medium">أو</span>
        <span className="flex-1 h-px bg-gray-200" />
      </div>

      {error && (
        <div className="bg-danger-light text-danger text-sm p-3 rounded-xl">{error}</div>
      )}

      {GOOGLE_CLIENT_ID && (
        <div ref={googleContainerRef} className="w-full [&>div]:w-full" />
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
          {loading === "facebook" ? "جاري..." : "تابع عبر Facebook"}
        </button>
      )}
    </div>
  );
}