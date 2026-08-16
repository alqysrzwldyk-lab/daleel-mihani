"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import { useT } from "@/lib/useT";

export function DataTable({
  columns,
  children,
}: {
  columns: { key: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="admin-table-wrap">
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const T = useT();
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <span>
        {T("الصفحة {page} من {totalPages}", { page, totalPages })}
      </span>
      <div className="flex gap-2">
        <button
          className="admin-action-btn"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronRight className="w-3.5 h-3.5 inline" />
          {T("السابقة")}
        </button>
        <button
          className="admin-action-btn"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          {T("التالية")}
          <ChevronLeft className="w-3.5 h-3.5 inline" />
        </button>
      </div>
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const T = useT();
  let cls = "admin-pill-gray";
  const labels: Record<string, string> = {
    active: "نشط",
    disabled: "معطّل",
    verified: "موثّق",
    pending: "قيد المراجعة",
    reviewed: "تمت المراجعة",
    removed: "تم الحذف",
    open: "مفتوحة",
    closed: "مغلقة",
    completed: "مكتملة",
    cancelled: "ملغاة",
    refunded: "مستردة",
    expired: "منتهية",
    paused: "موقوف",
    sold: "مباع",
    reserved: "محجوز",
    coming_soon: "قريباً",
    archived: "مؤرشف",
    professional: "مهني",
    employer: "صاحب عمل",
    admin: "مدير",
    premium: "مميز",
    free: "مجاني",
    payment: "دفع",
    commission: "عمولة",
    withdrawal: "سحب",
    deposit: "إيداع",
    subscription: "اشتراك",
    boost: "ترقية",
    info: "معلومة",
    success: "نجاح",
    warning: "تحذير",
    alert: "تنبيه",
  };
  if (value === "active" || value === "verified" || value === "completed" || value === "open" || value === "success")
    cls = "admin-pill-green";
  else if (value === "disabled" || value === "removed" || value === "cancelled" || value === "closed" || value === "alert" || value === "refunded")
    cls = "admin-pill-red";
  else if (value === "pending" || value === "warning" || value === "premium")
    cls = "admin-pill-amber";
  else if (value === "professional" || value === "employer" || value === "admin" || value === "info")
    cls = "admin-pill-blue";

  return <span className={`admin-pill ${cls}`}>{T(labels[value] ?? value)}</span>;
}

export function dateStr(d: Date | string | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}
