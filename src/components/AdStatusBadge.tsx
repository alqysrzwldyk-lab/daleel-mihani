"use client";

import { useT } from "@/lib/useT";

// شارة حالة الإعلان موحّدة الاستخدام (بطاقات، لوحة، تفاصيل)
export type AdStatus = "active" | "paused" | "sold" | "reserved" | "expired" | "coming_soon" | "archived";

const STATUS_META: Record<AdStatus, { label: string; className: string }> = {
  active: { label: "متوفر", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  reserved: { label: "محجوز", className: "bg-sky-50 text-sky-700 border border-sky-200" },
  sold: { label: "تم البيع", className: "bg-rose-50 text-rose-700 border border-rose-200" },
  expired: { label: "منتهي", className: "bg-slate-100 text-slate-600 border border-slate-200" },
  coming_soon: { label: "قريباً", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  paused: { label: "موقوف مؤقتاً", className: "bg-orange-50 text-orange-700 border border-orange-200" },
  archived: { label: "مؤرشف", className: "bg-slate-100 text-slate-600 border border-slate-200" },
};

export function adStatusLabel(status: string): string {
  return STATUS_META[status as AdStatus]?.label || "متوفر";
}

export default function AdStatusBadge({ status }: { status: string }) {
  const T = useT();
  const meta = STATUS_META[status as AdStatus] || STATUS_META.active;
  return <span className={`badge ${meta.className}`}>{T(meta.label)}</span>;
}
