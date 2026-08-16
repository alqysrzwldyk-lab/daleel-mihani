"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Briefcase, Search, Plus, Home, User, Building2, Shield, Languages } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useT } from "@/lib/useT";
import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "professional" | "employer" | "admin";
};

export default function Navbar() {
  const tApp = useTranslations("app");
  const T = useT();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        setHasProfile(!!d.profile?.bio);
      })
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setShowUserMenu(false);
    window.location.href = "/";
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="app-header-title">
          <Briefcase className="w-6 h-6" />
          <span className="hidden sm:inline">{tApp("name")}</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
          <div className="search-bar w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={T("ابحث عن مهنيين، خدمات، أو إعلانات...")}
            />
            <button type="submit">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1 me-auto md:me-0">
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: locale === "ar" ? "en" : "ar" })}
            className="btn btn-ghost btn-sm"
            aria-label={locale === "ar" ? "English" : T("العربية")}
          >
            <Languages className="w-4 h-4" />
            <span>{locale === "ar" ? "EN" : T("عربي")}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-1">
              <NotificationBell />

              <button
                onClick={() => setShowUserMenu(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-[var(--border-light)] transition"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  {user.role === "professional" ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : user.role === "admin" ? (
                    <Shield className="w-4 h-4 text-primary" />
                  ) : (
                    <Building2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="text-sm font-medium max-w-[80px] truncate hidden sm:inline">
                  {user.name}
                </span>
              </button>

              <Link
                href="/"
                className="btn btn-ghost btn-sm hidden sm:flex"
              >
                <Home className="w-4 h-4" />
                <span>{T("الصفحة الرئيسية")}</span>
              </Link>
              {user.role === "employer" ? (
                <Link
                  href="/dashboard/jobs/new"
                  className="btn btn-primary btn-sm hidden sm:flex"
                >
                  <Plus className="w-4 h-4" />
                  <span>{T("إضافة إعلان توظيف")}</span>
                </Link>
              ) : user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="btn btn-primary btn-sm hidden sm:flex"
                >
                  <Shield className="w-4 h-4" />
                  <span>{T("لوحة الإدارة")}</span>
                </Link>
              ) : (
                <Link
                  href="/add-post"
                  className="btn btn-primary btn-sm hidden sm:flex"
                >
                  <Plus className="w-4 h-4" />
                  <span>{T("إضافة إعلان")}</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-ghost btn-sm">
                {T("دخول")}
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                {T("إنشاء حساب")}
              </Link>
            </div>
          )}
        </div>
      </div>

      {user && (
        <UserMenu
          open={showUserMenu}
          onClose={() => setShowUserMenu(false)}
          user={user}
          onLogout={handleLogout}
          hasProfile={hasProfile}
        />
      )}
    </header>
  );
}
