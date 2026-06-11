"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PROFESSIONS } from "@/lib/professions";

export default function ProfessionFilter() {
  const t = useTranslations("search");
  const tProf = useTranslations("professions");
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("profession") || "all";
  const q = searchParams.get("q") || "";

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
        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
          current === "all" ? "bg-[var(--primary)] text-white" : "bg-white border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"
        }`}
      >
        {t("allProfessions")}
      </button>
      {PROFESSIONS.map((p) => (
        <button
          key={p.key}
          onClick={() => handleChange(p.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            current === p.key ? "bg-[var(--primary)] text-white" : "bg-white border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"
          }`}
        >
          {p.icon} {tProf(p.key)}
        </button>
      ))}
    </div>
  );
}
