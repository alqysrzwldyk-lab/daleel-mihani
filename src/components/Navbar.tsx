"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Menu, X, Search, MapPin, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }

  const links = [
    { href: "/", label: t("home") },
    { href: "/search", label: t("search") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[var(--border)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* ─── الجانب الأيمن: الهوية ومحدد الموقع (السوق المفتوح ستايل) ─── */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2 font-black text-xl text-[var(--primary)]">
              <Briefcase className="w-7 h-7" />
              <span className="hidden sm:inline">{tApp("name")}</span>
            </Link>

            {/* محدد المدينة المستوحى من OpenSooq */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-700 hover:bg-gray-100 transition cursor-pointer">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent border-none outline-none font-medium text-gray-700 cursor-pointer text-xs pr-1"
              >
                <option value="all">كل المدن</option>
                <option value="amman">عمان</option>
                <option value="irbid">إربد</option>
                <option value="zarqa">الزرقاء</option>
              </select>
            </div>
          </div>

          {/* ─── المنتصف: شريط البحث المركزي العصري ─── */}
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <form className="relative flex items-center w-full h-10 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)]/20 focus-within:border-[var(--primary)] transition">
              <input
                type="text"
                placeholder="ابحث عن مهنيين، شركات، أو خدمات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-transparent px-4 py-2 text-xs text-gray-800 outline-none placeholder-gray-400"
              />
              <button
                type="submit"
                className="h-full px-4 bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 transition flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث</span>
              </button>
            </form>
          </div>

          {/* ─── الجانب الأيسر: الأزرار والإشعارات والتحكم ─── */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-[var(--muted)] hover:text-[var(--primary)] font-medium text-sm transition">
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-3">
                {user.role === "professional" && (
                  <Link href="/dashboard" className="text-[var(--primary)] text-sm font-medium hover:underline">
                    {t("dashboard")}
                  </Link>
                )}
                
                {/* جرس الإشعارات الذكي الخاص بك */}
                <NotificationBell />

                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-700 max-w-[80px] truncate">{user.name}</span>
                </div>

                <button onClick={handleLogout} className="text-xs font-medium text-red-600 hover:text-red-700 transition px-2 py-1">
                  {t("logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-[var(--primary)] font-medium text-sm px-3 py-2 hover:opacity-80 transition">
                  {t("login")}
                </Link>
                <Link href="/register" className="btn-primary text-xs py-2 px-4 shadow-sm">
                  {t("register")}
                </Link>
              </div>
            )}

            {/* زر "أضف إعلان / عرض" البارز والملون المقتبس من السوق المفتوح */}
            <Link
              href={user?.role === "employer" ? "/api/hire" : "/search"}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>أضف إعلان</span>
            </Link>
          </div>

          {/* زر الموبايل المستجيب */}
          <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" onClick={() => setMenuOpen(!menuOpen)} aria-label="القائمة">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* ─── قائمة الموبايل المستجيبة (Mobile Menu) ─── */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-3 border-t border-[var(--border)] pt-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* شريط البحث المخصص للموبايل لضمان وصول سريع */}
            <form className="relative flex items-center w-full h-9 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-2">
              <input
                type="text"
                placeholder="ابحث هنا..."
                className="w-full h-full bg-transparent px-3 text-xs outline-none"
              />
              <button className="h-full px-3 bg-[var(--primary)] text-white">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {links.map((link) => (
              <Link key={link.href} href={link.href} className="block py-2 text-sm font-medium text-gray-700 hover:text-[var(--primary)]" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <>
                <div className="flex items-center justify-between py-2 border-y border-gray-100 my-1">
                  <span className="text-xs font-medium text-gray-500">مرحباً، {user.name}</span>
                  <NotificationBell />
                </div>

                {user.role === "professional" && (
                  <Link href="/dashboard" className="block py-2 text-sm text-[var(--primary)] font-medium" onClick={() => setMenuOpen(false)}>
                    {t("dashboard")}
                  </Link>
                )}
                
                <button onClick={handleLogout} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 rounded-lg font-medium transition">
                  {t("logout")}
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1 text-center py-2 border border-gray-200 rounded-xl text-xs font-medium" onClick={() => setMenuOpen(false)}>
                  {t("login")}
                </Link>
                <Link href="/register" className="flex-1 btn-primary text-center text-xs py-2 rounded-xl font-medium" onClick={() => setMenuOpen(false)}>
                  {t("register")}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}