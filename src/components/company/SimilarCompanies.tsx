"use client";

import { Building2 } from "lucide-react";
import { useT } from "@/lib/useT";
import CompanyCard from "@/components/company/CompanyCard";
import type { SimilarCompany } from "@/lib/companyTypes";

// قسم الشركات المشابهة (نفس القطاع أو المدينة)
export default function SimilarCompanies({ companies }: { companies: SimilarCompany[] }) {
  const T = useT();
  if (!companies || companies.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-black text-[var(--foreground)] mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-[var(--primary)]" />
        {T("شركات مشابهة")}
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <CompanyCard key={company._id} company={company} />
        ))}
      </div>
    </div>
  );
}
