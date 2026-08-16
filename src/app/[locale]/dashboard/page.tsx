"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  Settings, Moon, Sun, Info, HelpCircle, FileText,
  User, ChevronLeft, LogOut, Briefcase, Users, Building2, Heart, Shield
} from "lucide-react";
import { useT } from "@/lib/useT";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "professional" | "employer" | "admin";
};

export default function DashboardPage() {
  const router = useRouter();
  const T = useT();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return stored ? stored === "dark" : prefersDark;
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.push("/login"); return; }
        setUser(d.user);
        setHasProfile(!!d.profile?.bio);
        setLoaded(true);
      });
  }, [router]);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (!loaded) {
    return (
      <div className="page-container max-w-xl mx-auto">
        <div className="space-y-3">
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-40 rounded-xl" />
          <div className="skeleton h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  const settingsItems = [
    ...(user?.role === "professional"
      ? [
          {
            icon: hasProfile ? User : Briefcase,
            label: hasProfile ? "الملف المهني" : "إنشاء ملف مهني",
            desc: hasProfile ? "تعديل ملفك المهني" : "أنشئ ملفك المهني للظهور لأصحاب العمل",
            href: "/create-profile",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: FileText,
            label: "إعلاناتي",
            desc: "إدارة إعلاناتك المنشورة",
            href: "/dashboard/my-ads",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ]
      : user?.role === "employer"
      ? [
          {
            icon: Briefcase,
            label: "لوحة الشركة",
            desc: "إدارة إعلاناتك الوظيفية ومتابعة المتقدمين",
            href: "/dashboard/jobs",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: FileText,
            label: "إعلان توظيف جديد",
            desc: "انشر إعلان وظيفي جديد",
            href: "/dashboard/jobs/new",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            icon: Users,
            label: "طلبات التوظيف",
            desc: "عرض المتقدمين على وظائفك",
            href: "/dashboard/applications",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: Building2,
            label: "ملف الشركة",
            desc: "تعديل معلومات شركتك وصفحتها العامة",
            href: "/company/edit",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ]
      : [
          {
            icon: Shield,
            label: "لوحة الإدارة",
            desc: "إدارة المستخدمين والمحتوى والبلاغات",
            href: "/admin",
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ]),
    {
      icon: Heart,
      label: "إعلاناتي المفضلة",
      desc: "إعلانات حفظتها للعودة إليها لاحقاً",
      href: "/dashboard/my-favorites",
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      icon: Moon,
      label: "المظهر",
      desc: darkMode ? "الوضع النهاري" : "الوضع الليلي",
      href: null,
      color: "text-slate-600",
      bg: "bg-slate-100",
      toggle: true,
    },
    {
      icon: Info,
      label: "معلومات عن التطبيق",
      desc: "دليل مهني — منصة تربط المحترفين بأصحاب العمل",
      href: null,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      icon: HelpCircle,
      label: "مساعدة",
      desc: "للتواصل والدعم: alyemdev@gmail.com",
      href: null,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="page-container max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{T("الإعدادات")}</h1>
          <p className="text-xs text-muted">{user?.name}</p>
        </div>
      </div>

      <div className="space-y-2">
        {settingsItems.map((item, i) => {
          const Icon = item.icon;
          if (item.toggle) {
            return (
              <button
                key={i}
                onClick={toggleTheme}
                className="w-full app-card app-card-hover p-4 flex items-center gap-4 text-right"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  {darkMode ? <Sun className={`w-5 h-5 ${item.color}`} /> : <Moon className={`w-5 h-5 ${item.color}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{T(item.label)}</p>
                  <p className="text-xs text-muted">{T(darkMode ? "الوضع النهاري" : "الوضع الليلي")}</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? "bg-primary" : "bg-gray-200"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${darkMode ? "left-0.5" : "right-0.5"}`} />
                </div>
              </button>
            );
          }
          if (!item.href) {
            return (
              <div
                key={i}
                className="app-card p-4 flex items-center gap-4 text-right cursor-default"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{T(item.label)}</p>
                  <p className="text-xs text-muted">{T(item.desc)}</p>
                </div>
              </div>
            );
          }
          return (
            <Link
              key={i}
              href={item.href}
              className="app-card app-card-hover p-4 flex items-center gap-4 text-right"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{T(item.label)}</p>
                <p className="text-xs text-muted">{T(item.desc)}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-light flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleLogout}
          className="btn btn-ghost text-danger text-sm flex items-center gap-2 mx-auto"
        >
          <LogOut className="w-4 h-4" />
          {T("تسجيل خروج")}
        </button>
        <p className="text-[11px] text-muted-light mt-4">{T("الإصدار 1.0.0")}</p>
      </div>
    </div>
  );
}
