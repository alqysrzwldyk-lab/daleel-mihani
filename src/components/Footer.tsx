"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const tApp = useTranslations("app");

  return (
    <footer className="bg-slate-900 text-slate-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="font-semibold text-white mb-1">{tApp("name")}</p>
        <p className="text-sm">{tApp("tagline")}</p>
        <p className="text-xs mt-4 text-slate-500">© {new Date().getFullYear()} {t("rights")}</p>
      </div>
    </footer>
  );
}
