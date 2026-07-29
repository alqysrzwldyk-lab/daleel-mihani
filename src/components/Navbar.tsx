"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Search, Plus, Home, User, Building2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";

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

              <button
                onClick={() => setShowUserMenu(true)}
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
              </button>

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
