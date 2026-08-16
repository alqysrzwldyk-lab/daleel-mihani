"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getAvailableProfessions } from "@/lib/professions";
import { useT } from "@/lib/useT";

export default function ProfessionFilter() {
  const t = useTranslations("search");
  const T = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("profession") || "all";
  const q = searchParams.get("q") || "";

  const professions = getAvailableProfessions();

  function handleChange(profession: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (profession !== "all") params.set("profession", profession);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleChange("all")}
        className={`chip ${current === "all" ? "active" : ""}`}
      >
        {t("allProfessions")}
      </button>
      {professions.map((p) => (
        <button
          key={p.key}
          onClick={() => handleChange(p.key)}
          className={`chip ${current === p.key ? "active" : ""}`}
        >
          {p.icon} {T(p.arabic)}
        </button>
      ))}
    </div>
  );
}
