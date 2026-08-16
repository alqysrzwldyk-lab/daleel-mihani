"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useT } from "@/lib/useT";
import { Languages } from "lucide-react";

export default function Footer() {
  const t = useTranslations("footer");
  const tApp = useTranslations("app");
  const T = useT();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <footer className="desktop-only bg-slate-900 text-slate-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="font-semibold text-white mb-1">{tApp("name")}</p>
        <p className="text-sm">{tApp("tagline")}</p>
        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: locale === "ar" ? "en" : "ar" })}
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition"
        >
          <Languages className="w-3.5 h-3.5" />
          {locale === "ar" ? "English" : T("العربية")}
        </button>
        <p className="text-xs mt-4 text-slate-500">© {new Date().getFullYear()} {t("rights")}</p>
      </div>
    </footer>
  );
}
