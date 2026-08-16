"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Search, RotateCcw } from "lucide-react";
import { JOB_DEPARTMENTS, WORK_TYPES, JORDAN_GOVERNORATES } from "@/lib/jobs";
import { useT } from "@/lib/useT";

// شريط بحث وتصفية الوظائف (المهنة، التخصص، المدينة، الراتب، نوع الدوام، اسم الشركة)
export default function JobsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [profession, setProfession] = useState(searchParams.get("profession") || "all");
  const [city, setCity] = useState(searchParams.get("city") || "all");
  const [governorate, setGovernorate] = useState(searchParams.get("governorate") || "all");
  const [workType, setWorkType] = useState(searchParams.get("workType") || "all");
  const [salaryMin, setSalaryMin] = useState(searchParams.get("salaryMin") || "all");
  const [company, setCompany] = useState(searchParams.get("company") || "");
  const T = useT();

  function pushFilter() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (profession !== "all") params.set("profession", profession);
    if (city !== "all") params.set("city", city);
    if (governorate !== "all") params.set("governorate", governorate);
    if (workType !== "all") params.set("workType", workType);
    if (salaryMin !== "all") params.set("salaryMin", salaryMin);
    if (company.trim()) params.set("company", company.trim());
    router.push(`/jobs?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushFilter();
  }

  function reset() {
    setQ("");
    setProfession("all");
    setCity("all");
    setGovernorate("all");
    setWorkType("all");
    setSalaryMin("all");
    setCompany("");
    router.push("/jobs");
  }

  const selectClass =
    "w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={T("ابحث بالوظيفة، المهنة، الشركة، أو المهارة...")}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl ps-10 pe-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 inline-flex items-center gap-1.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition active:scale-95"
        >
          <Search className="w-4 h-4" />
          {T("بحث")}
        </button>
        <button
          type="button"
          onClick={reset}
          title={T("إعادة تعيين")}
          className="shrink-0 p-2.5 bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--muted)] rounded-xl transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <select value={profession} onChange={(e) => setProfession(e.target.value)} className={selectClass}>
          <option value="all">{T("كل التخصصات")}</option>
          {JOB_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {T(d)}
            </option>
          ))}
        </select>

        <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
          <option value="all">{T("كل المدن")}</option>
          {JORDAN_GOVERNORATES.map((c) => (
            <option key={c} value={c}>
              {T(c)}
            </option>
          ))}
        </select>

        <select value={governorate} onChange={(e) => setGovernorate(e.target.value)} className={selectClass}>
          <option value="all">{T("كل المحافظات")}</option>
          {JORDAN_GOVERNORATES.map((g) => (
            <option key={g} value={g}>
              {T(g)}
            </option>
          ))}
        </select>

        <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={selectClass}>
          <option value="all">{T("كل أنواع الدوام")}</option>
          {WORK_TYPES.map((w) => (
            <option key={w} value={w}>
              {T(w)}
            </option>
          ))}
        </select>

        <select value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className={selectClass}>
          <option value="all">{T("كل الرواتب")}</option>
          <option value="300">300+</option>
          <option value="500">500+</option>
          <option value="700">700+</option>
          <option value="1000">1000+</option>
          <option value="1500">1500+</option>
          <option value="2000">2000+</option>
        </select>

        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={T("اسم الشركة...")}
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition"
        />
      </div>
    </form>
  );
}
