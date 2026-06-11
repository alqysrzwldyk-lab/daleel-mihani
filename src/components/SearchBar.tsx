"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

type Props = {
  initialQuery?: string;
  variant?: "hero" | "inline";
};

export default function SearchBar({ initialQuery = "", variant = "inline" }: Props) {
  const t = useTranslations("hero");
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/search?${params.toString()}`);
  }

  if (variant === "hero") {
    return (
      <form onSubmit={handleSubmit} className="flex w-full max-w-2xl mx-auto gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full ps-12 pe-4 py-4 rounded-xl text-slate-800 shadow-lg outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
        <button type="submit" className="bg-white text-[var(--primary)] font-bold px-6 py-4 rounded-xl shadow-lg hover:bg-slate-50 transition">
          {t("searchBtn")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="input-field ps-10"
        />
      </div>
      <button type="submit" className="btn-primary">{t("searchBtn")}</button>
    </form>
  );
}
