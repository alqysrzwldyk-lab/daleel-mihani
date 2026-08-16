"use client";

import { MapPin, ExternalLink } from "lucide-react";
import { useT } from "@/lib/useT";
import type { CompanyPublic } from "@/lib/companyTypes";

// موقع الشركة: خريطة مدمجة عند توفر الإحداثيات أو عنوان نصي بديل
export default function CompanyLocation({ company }: { company: CompanyPublic }) {
  const T = useT();
  const hasCoords = typeof company.latitude === "number" && typeof company.longitude === "number";
  const hasAddress = !!company.address || !!company.city || !!company.country;

  if (!hasCoords && !hasAddress) return null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8">
      <h2 className="text-lg font-black text-[var(--foreground)] mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[var(--primary)]" />
        {T("موقع الشركة")}
      </h2>

      {hasCoords && (
        <div className="rounded-xl overflow-hidden border border-[var(--border)] mb-4 h-56 md:h-64">
          <iframe
            title={T("موقع الشركة")}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${company.longitude! - 0.02}%2C${company.latitude! - 0.015}%2C${company.longitude! + 0.02}%2C${company.latitude! + 0.015}&layer=mapnik&marker=${company.latitude}%2C${company.longitude}`}
            className="w-full h-full"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          {[company.address, company.city, company.country].filter(Boolean).join(T("، ")) || T("الموقع غير محدد")}
        </p>
        {hasCoords && (
          <a
            href={`https://www.google.com/maps?q=${company.latitude},${company.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-3.5 py-2 rounded-xl transition hover:bg-[var(--primary)]/15"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {T("فتح في الخرائط")}
          </a>
        )}
      </div>
    </div>
  );
}
