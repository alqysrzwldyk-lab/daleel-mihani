"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/lib/useT";

// زر تبديل الوضع الليلي/النهاري مع الحفظ في التخزين المحلي
export default function ThemeToggle() {
  const T = useT();
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
  );

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // تجاهل أخطاء التخزين في بيئات الخصوصية
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={T("تبديل الوضع الليلي")}
      title={dark ? T("الوضع النهاري") : T("الوضع الليلي")}
      className="p-2 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)] rounded-lg transition-colors"
    >
      {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
    </button>
  );
}
