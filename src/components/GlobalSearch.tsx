"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, User as UserIcon, Building2, Briefcase, Megaphone, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

type SearchResultItem = {
  key: string;
  type: "professional" | "company" | "job" | "ad";
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ReactNode;
};

type Results = {
  professionals: { _id: string; name: string; photo?: string; professions: string[]; location?: string; averageRating?: number }[];
  companies: { _id: string; name: string; logo?: string; industry?: string; city?: string }[];
  jobs: { _id: string; jobTitle: string; companyName: string; city: string; status: string }[];
  ads: { _id: string; title: string; category: string; type: string; location: string }[];
};

const EMPTY: Results = { professionals: [], companies: [], jobs: [], ads: [] };

// تلوين الجزء المطابق من النص أثناء العرض
function highlight(text: string, query: string) {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let idx = lower.indexOf(q);
  let key = 0;
  while (idx !== -1) {
    if (idx > i) nodes.push(text.slice(i, idx));
    nodes.push(
      <mark key={key++} className="bg-[var(--warning)]/30 text-[var(--foreground)] rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
    idx = lower.indexOf(q, i);
  }
  if (i < text.length) nodes.push(text.slice(i));
  return nodes;
}

type Props = {
  variant?: "desktop" | "mobile";
};

export default function GlobalSearch({ variant = "desktop" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  // تنظيف المؤقت وطلبات الجلب عند الإغلاق
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  // إغلاق القائمة عند النقر خارج المكوّن
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function resetShortQuery() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    abortRef.current?.abort();
    setResults(EMPTY);
    setStatus("idle");
    setSearchedQuery("");
    setOpen(false);
    setActiveIndex(-1);
  }

  async function runSearch(q: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setOpen(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      if (!res.ok) throw new Error("search failed");
      const data = await res.json();
      setResults(data && Array.isArray(data.professionals) ? data : EMPTY);
      setSearchedQuery(q);
      setStatus("done");
      setActiveIndex(-1);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setResults(EMPTY);
        setStatus("done");
        setActiveIndex(-1);
      }
    }
  }

  function handleChange(value: string) {
    setQuery(value);
    const q = value.trim();
    if (q.length < 2) {
      resetShortQuery();
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => runSearch(q), 250);
  }

  function clearSearch() {
    resetShortQuery();
    setQuery("");
    inputRef.current?.focus();
  }

  const flatList = useMemo<SearchResultItem[]>(() => {
    const list: SearchResultItem[] = [];
    for (const p of results.professionals) {
      list.push({
        key: `pro-${p._id}`,
        type: "professional",
        title: p.name,
        subtitle: p.professions.join("، ") || p.location || "",
        href: `/professionals/${p._id}`,
        icon: <UserIcon className="w-4 h-4" />,
      });
    }
    for (const c of results.companies) {
      list.push({
        key: `co-${c._id}`,
        type: "company",
        title: c.name,
        subtitle: [c.industry, c.city].filter(Boolean).join(" — "),
        href: `/company/${c._id}`,
        icon: <Building2 className="w-4 h-4" />,
      });
    }
    for (const j of results.jobs) {
      list.push({
        key: `job-${j._id}`,
        type: "job",
        title: j.jobTitle,
        subtitle: `${j.companyName}${j.city ? ` — ${j.city}` : ""}`,
        href: `/jobs/${j._id}`,
        icon: <Briefcase className="w-4 h-4" />,
      });
    }
    for (const a of results.ads) {
      list.push({
        key: `ad-${a._id}`,
        type: "ad",
        title: a.title,
        subtitle: `${a.category}${a.location ? ` — ${a.location}` : ""}`,
        href: `/search?q=${encodeURIComponent(a.title)}`,
        icon: <Megaphone className="w-4 h-4" />,
      });
    }
    return list;
  }, [results]);

  const totalCount = flatList.length;

  function go(item: SearchResultItem) {
    setOpen(false);
    resetShortQuery();
    setQuery("");
    inputRef.current?.blur();
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => (totalCount === 0 ? -1 : (i + 1) % totalCount));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (totalCount === 0 ? -1 : (i - 1 + totalCount) % totalCount));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && flatList[activeIndex]) {
        e.preventDefault();
        go(flatList[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const inputBase =
    "w-full h-full bg-transparent px-4 py-2 text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]";
  const wrapperBase =
    "relative flex items-center w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)]/20 focus-within:border-[var(--primary)] transition";

  return (
    <div ref={rootRef} className={variant === "desktop" ? "flex-1 max-w-xl mx-2 hidden md:block relative" : "relative"}>
      <div className={variant === "desktop" ? wrapperBase : `${wrapperBase} h-9 rounded-lg`}>
        <Search className="w-3.5 h-3.5 shrink-0 ms-3 text-[var(--muted)]" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="global-search-results"
          aria-activedescendant={activeIndex >= 0 ? `global-search-item-${activeIndex}` : undefined}
          aria-label="البحث في الموقع"
          placeholder={variant === "desktop" ? "ابحث عن مهنيين، شركات، وظائف، أو خدمات..." : "ابحث هنا..."}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (status === "done" && totalCount > 0) setOpen(true);
          }}
          className={variant === "desktop" ? inputBase : `${inputBase} ps-3 text-xs`}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            aria-label="مسح البحث"
            onClick={clearSearch}
            className="shrink-0 p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          id="global-search-results"
          role="listbox"
          aria-label="نتائج البحث"
          className="absolute top-full mt-2 w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden text-right"
          style={{ direction: "rtl" }}
        >
          {status === "loading" ? (
            <div className="flex items-center gap-3 px-4 py-6 text-sm text-[var(--muted)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" aria-hidden />
              جاري البحث...
            </div>
          ) : totalCount === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm font-bold text-[var(--foreground)]">لا توجد نتائج مطابقة</p>
              <p className="text-xs text-[var(--muted)] mt-1">جرّب كلمات بحث أخرى أو عبارات أقصر.</p>
            </div>
          ) : (
            <>
              <div className="max-h-[min(60vh,420px)] overflow-y-auto py-1">
                {flatList.map((item, i) => (
                  <button
                    key={item.key}
                    id={`global-search-item-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    type="button"
                    onClick={() => go(item)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-right transition ${
                      i === activeIndex ? "bg-[var(--primary)]/10" : "hover:bg-[var(--surface)]"
                    }`}
                  >
                    <span className="mt-0.5 p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[var(--foreground)] truncate">
                        {highlight(item.title, searchedQuery)}
                      </span>
                      {item.subtitle && (
                        <span className="block text-xs text-[var(--muted)] truncate">
                          {highlight(item.subtitle, searchedQuery)}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--muted)] shrink-0">
                      {item.type === "professional"
                        ? "مهني"
                        : item.type === "company"
                        ? "شركة"
                        : item.type === "job"
                        ? "وظيفة"
                        : "إعلان"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--muted)] flex items-center justify-between bg-[var(--surface)]">
                <span>{totalCount} نتيجة</span>
                <span className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-[10px]">↑↓</kbd> تنقّل
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-[10px]">Enter</kbd> فتح
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
