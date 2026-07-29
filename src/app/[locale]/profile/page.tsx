"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { User, LogOut, ChevronLeft, Mail, Briefcase, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "professional" | "employer";
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.push("/login");
          return;
        }
        setUser(d.user);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton h-48 rounded-xl mb-4" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>حسابي</h1>
      </div>

      <div className="app-card p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-bold text-lg">{user.name}</p>
            <p className="text-sm text-muted flex items-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
            <span className={`badge mt-1.5 ${user.role === "professional" ? "badge-primary" : "badge-success"}`}>
              {user.role === "professional" ? "محترف" : "صاحب شركة"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {user.role === "professional" && (
          <Link href="/dashboard" className="app-card p-4 flex items-center justify-between hover:border-primary/30 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">لوحة التحكم</p>
                <p className="text-xs text-muted">إدارة ملفك المهني</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-light" />
          </Link>
        )}

        <Link href="/dashboard/my-ads" className="app-card p-4 flex items-center justify-between hover:border-primary/30 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange" />
            </div>
            <div>
              <p className="font-semibold text-sm">محفظتي الإعلانية</p>
              <p className="text-xs text-muted">إدارة إعلاناتك</p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-light" />
        </Link>
      </div>

      <div className="mt-8">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-danger btn-block"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {loggingOut ? "جاري تسجيل الخروج..." : "تسجيل خروج"}
        </button>
      </div>
    </div>
  );
}
