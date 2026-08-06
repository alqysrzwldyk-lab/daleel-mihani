"use client";

import { Sparkles } from "lucide-react";
import type { CompanyPublic } from "@/lib/companyTypes";

// قسم الخدمات الرئيسية التي تقدمها الشركة
export default function CompanyServices({ company }: { company: CompanyPublic }) {
  if (!company.services || company.services.length === 0) return null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8">
      <h2 className="text-lg font-black text-[var(--foreground)] mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[var(--primary)]" />
        خدمات الشركة
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {company.services.map((service, i) => (
          <div
            key={service}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3"
          >
            <span className="w-8 h-8 shrink-0 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-black text-sm">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-sm font-semibold text-[var(--foreground)] leading-relaxed">{service}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
