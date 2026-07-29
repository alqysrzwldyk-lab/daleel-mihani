"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Search, Plus, ChevronDown, LogOut, User, Building2, Home } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import NotificationBell from "@/components/NotificationBell";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "professional" | "employer";
};

export default function Navbar() {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const router = useRouter();
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
              placeholder="ابحث عن مهنيين، خدمات، أو إعلانات..."
            />
            <button type="submit">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1 me-auto md:me-0">
          {user ? (
            <div className="flex items-center gap-1">
              <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.role === "professional" ? (
                      <User className="w-4 h-4 text-primary" />
                    ) : (
                      <Building2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium max-w-[80px] truncate hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted hidden sm:block" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                      {user.role === "professional" && (
                        <>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <User className="w-4 h-4" />
                            لوحة التحكم
                          </Link>
                          {!hasProfile && (
                            <Link
                              href="/create-profile"
                              className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-emerald-50 transition text-emerald-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Plus className="w-4 h-4" />
                              إنشاء ملف مهني
                            </Link>
                          )}
                        </>
                      )}
                      {user.role === "employer" && (
                        <Link
                          href="/search"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Search className="w-4 h-4" />
                          ابحث عن محترفين
                        </Link>
                      )}
                      <Link
                        href="/add-post"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Plus className="w-4 h-4" />
                        إضافة إعلان
                      </Link>
                      <div className="border-t border-gray-50 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          تسجيل خروج
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Link
                href="/"
                className="btn btn-ghost btn-sm hidden sm:flex"
              >
                <Home className="w-4 h-4" />
                <span>الصفحة الرئيسية</span>
              </Link>
              <Link
                href="/add-post"
                className="btn btn-primary btn-sm hidden sm:flex"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة إعلان</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-ghost btn-sm">
                دخول
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
