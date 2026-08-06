"use client";

import {
  MapPin,
  CalendarDays,
  Users,
  Building2,
  Clock,
  Mail,
  Phone,
  Globe,
  LayoutGrid,
} from "lucide-react";
import type { CompanyPublic } from "@/lib/companyTypes";

// بطاقة معلومات أساسية عن الشركة (تُعرض في العمود الجانبي)
export default function CompanyInfo({ company }: { company: CompanyPublic }) {
  const items: Array<{ icon: typeof MapPin; label: string; value?: string }> = [];

  if (company.industry) items.push({ icon: LayoutGrid, label: "القطاع", value: company.industry });
  if (company.foundedYear) items.push({ icon: CalendarDays, label: "سنة التأسيس", value: String(company.foundedYear) });
  if (company.employeesCount) items.push({ icon: Users, label: "عدد الموظفين", value: String(company.employeesCount) });
  if (company.companySize) items.push({ icon: Building2, label: "حجم الشركة", value: company.companySize });
  if (company.address) items.push({ icon: MapPin, label: "العنوان", value: company.address });
  if (company.country) items.push({ icon: Globe, label: "الدولة", value: company.country });
  if (company.workingHours) items.push({ icon: Clock, label: "ساعات العمل", value: company.workingHours });
  if (company.phone) items.push({ icon: Phone, label: "الهاتف", value: company.phone });
  if (company.email) items.push({ icon: Mail, label: "البريد الإلكتروني", value: company.email });

  if (items.length === 0) return null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6">
      <h2 className="text-lg font-black text-[var(--foreground)] mb-4">📌 معلومات الشركة</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3"
          >
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
              <item.icon className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--muted)] font-bold">{item.label}</p>
              <p className="text-sm font-bold text-[var(--foreground)] truncate">{item.value || "—"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
